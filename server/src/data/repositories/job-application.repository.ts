import { GenericRepository } from './generic.repository.ts';
import { jobApplication, JobApplication, JobApplicationInsert } from '../schema/job-application.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { applicationStatusHistory } from '../schema/application-status-history.schema.ts';
import { and, asc, count, desc, eq, SQL, sql } from 'drizzle-orm';
import { user } from '../schema/auth.schema.ts';
import { jobPosting } from '../schema/job-posting.schema.ts';
import { userSkill } from '../schema/user-skill.schema.ts';
import skill from '../schema/skill.schema.ts';
import { company } from '../schema/company.schema.ts';
import { jobPostingSkill } from '../schema/job-posting-skill.schema.ts';
import { JobApplicationStatus } from '../util/constants.ts';
import {
  applicationReview,
  ApplicationReview,
  ApplicationReviewInsert,
} from '../schema/application-review.schema.ts';

type FindByJobPostingPagination = {
  page?: number;
  pageSize?: number;
};

type FindByJobPostingResult = {
  data: JobApplicationListItem[];
  totalItems: number;
};

type FindJobApplicationDetailScope = {
  companyId?: number;
  userId?: string;
};

type FindJobApplicationReviewTargetScope = {
  companyId?: number;
};

export type JobApplicationReviewTarget = JobApplication & {
  companyId: number;
};

export type ApplicationReviewTarget = {
  jobApplicationId: number;
  companyId: number;
};

export type JobApplicationListItem = JobApplication & {
  user: {
    fullName: string;
    email: string;
    image: string | null;
  };
};

export type CandidateJobApplicationListItem = JobApplication & {
  jobPosting: {
    id: number;
    title: string | null;
    status: string;
    expiresAt: Date | null;
    company: {
      id: number;
      name: string;
      logoUrl: string | null;
    };
  };
};

type CandidateSkillDetail = {
  id: number;
  name: string;
  yearsOfExperience: number;
};

type JobPostingSkillDetail = {
  id: number;
  name: string;
  requiredYearsOfExperience: number | null;
};

export type JobApplicationDetail = {
  id: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    skills: CandidateSkillDetail[];
  };
  jobPosting: {
    id: number;
    title: string | null;
    description: string | null;
    status: string;
    company: {
      id: number;
      name: string;
      logoUrl: string | null;
    };
    skills: JobPostingSkillDetail[];
  };
};

@injectable()
export class JobApplicationRepository extends GenericRepository<JobApplication, JobApplicationInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, jobApplication);
  }

  async insertWithStatusHistory(payload: JobApplicationInsert): Promise<JobApplication> {
    return await this.db.transaction(async (tx) => {
      const [createdJobApplication] = await tx.insert(jobApplication).values(payload).returning();

      await tx.insert(applicationStatusHistory).values({
        jobApplicationId: createdJobApplication.id,
        status: createdJobApplication.status,
      });

      return createdJobApplication;
    });
  }

  async findReviewTarget(
    jobApplicationId: number,
    scope: FindJobApplicationReviewTargetScope = {},
  ): Promise<JobApplicationReviewTarget | null> {
    const filters: SQL[] = [
      eq(jobApplication.id, jobApplicationId),
      eq(jobApplication.isDeleted, false),
      eq(jobPosting.isDeleted, false),
      eq(company.isDeleted, false),
    ];

    if (scope.companyId !== undefined) {
      filters.push(eq(jobPosting.companyId, scope.companyId));
    }

    const [record] = await this.db
      .select({
        id: jobApplication.id,
        userId: jobApplication.userId,
        jobPostingId: jobApplication.jobPostingId,
        status: jobApplication.status,
        isDeleted: jobApplication.isDeleted,
        createdAt: jobApplication.createdAt,
        updatedAt: jobApplication.updatedAt,
        companyId: jobPosting.companyId,
      })
      .from(jobApplication)
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(and(...filters))
      .limit(1);

    return record ?? null;
  }

  async updateStatusWithHistory(
    jobApplicationId: number,
    status: JobApplicationStatus,
    reason?: string,
  ): Promise<JobApplication> {
    return await this.db.transaction(async (tx) => {
      const [updatedJobApplication] = await tx
        .update(jobApplication)
        .set({ status })
        .where(eq(jobApplication.id, jobApplicationId))
        .returning();

      await tx.insert(applicationStatusHistory).values({
        jobApplicationId,
        status,
        reason,
      });

      return updatedJobApplication;
    });
  }

  async findApplicationReviewTarget(jobApplicationId: number, userId: string): Promise<ApplicationReviewTarget | null> {
    const [record] = await this.db
      .select({
        jobApplicationId: jobApplication.id,
        companyId: jobPosting.companyId,
      })
      .from(jobApplication)
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(
        and(
          eq(jobApplication.id, jobApplicationId),
          eq(jobApplication.userId, userId),
          eq(jobApplication.isDeleted, false),
          eq(jobPosting.isDeleted, false),
          eq(company.isDeleted, false),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async findApplicationReview(jobApplicationId: number): Promise<ApplicationReview | null> {
    const [record] = await this.db
      .select()
      .from(applicationReview)
      .where(and(eq(applicationReview.jobApplicationId, jobApplicationId), eq(applicationReview.isDeleted, false)))
      .limit(1);

    return record ?? null;
  }

  async insertApplicationReview(payload: ApplicationReviewInsert): Promise<ApplicationReview> {
    const [createdReview] = await this.db.insert(applicationReview).values(payload).returning();

    if (!createdReview) {
      throw new Error('Database insert failed.');
    }

    return createdReview;
  }

  async findByJobPostingId(
    jobPostingId: number,
    pagination: FindByJobPostingPagination = {},
  ): Promise<FindByJobPostingResult> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const query = this.db
      .select({
        id: jobApplication.id,
        userId: jobApplication.userId,
        jobPostingId: jobApplication.jobPostingId,
        status: jobApplication.status,
        isDeleted: jobApplication.isDeleted,
        createdAt: jobApplication.createdAt,
        updatedAt: jobApplication.updatedAt,
        user: {
          fullName: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
          email: user.email,
          image: user.image,
        },
      })
      .from(jobApplication)
      .innerJoin(user, eq(jobApplication.userId, user.id))
      .where(eq(jobApplication.jobPostingId, jobPostingId))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ totalItems: count() })
      .from(jobApplication)
      .where(eq(jobApplication.jobPostingId, jobPostingId));

    const [data, [countResult]] = await Promise.all([query, countQuery]);

    return {
      data,
      totalItems: countResult?.totalItems ?? 0,
    };
  }

  async findByUserId(userId: string, pagination: FindByJobPostingPagination = {}): Promise<{
    data: CandidateJobApplicationListItem[];
    totalItems: number;
  }> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 50;
    const offset = (page - 1) * pageSize;
    const filters = and(
      eq(jobApplication.userId, userId),
      eq(jobApplication.isDeleted, false),
      eq(jobPosting.isDeleted, false),
      eq(company.isDeleted, false),
    );

    const query = this.db
      .select({
        id: jobApplication.id,
        userId: jobApplication.userId,
        jobPostingId: jobApplication.jobPostingId,
        status: jobApplication.status,
        isDeleted: jobApplication.isDeleted,
        createdAt: jobApplication.createdAt,
        updatedAt: jobApplication.updatedAt,
        jobPostingTitle: jobPosting.title,
        jobPostingStatus: jobPosting.status,
        jobPostingExpiresAt: jobPosting.expiresAt,
        companyId: company.id,
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
      })
      .from(jobApplication)
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(filters)
      .orderBy(desc(jobApplication.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ totalItems: count() })
      .from(jobApplication)
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(filters);

    const [data, [countResult]] = await Promise.all([query, countQuery]);

    return {
      data: data.map((record) => ({
        id: record.id,
        userId: record.userId,
        jobPostingId: record.jobPostingId,
        status: record.status,
        isDeleted: record.isDeleted,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        jobPosting: {
          id: record.jobPostingId,
          title: record.jobPostingTitle,
          status: record.jobPostingStatus,
          expiresAt: record.jobPostingExpiresAt,
          company: {
            id: record.companyId,
            name: record.companyName,
            logoUrl: record.companyLogoUrl,
          },
        },
      })),
      totalItems: countResult?.totalItems ?? 0,
    };
  }

  async findJobApplicationDetail(
    jobApplicationId: number,
    scope: FindJobApplicationDetailScope = {},
  ): Promise<JobApplicationDetail | null> {
    const baseFilters: SQL[] = [
      eq(jobApplication.id, jobApplicationId),
      eq(jobApplication.isDeleted, false),
      eq(jobPosting.isDeleted, false),
      eq(company.isDeleted, false),
      eq(user.isDeleted, false),
    ];

    if (scope.companyId !== undefined) {
      baseFilters.push(eq(jobPosting.companyId, scope.companyId));
    }

    if (scope.userId !== undefined) {
      baseFilters.push(eq(jobApplication.userId, scope.userId));
    }

    const [record] = await this.db
      .select({
        id: jobApplication.id,
        status: jobApplication.status,
        createdAt: jobApplication.createdAt,
        updatedAt: jobApplication.updatedAt,
        userId: user.id,
        userName: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
        userEmail: user.email,
        userImage: user.image,
        jobPostingId: jobPosting.id,
        jobPostingTitle: jobPosting.title,
        jobPostingDescription: jobPosting.description,
        jobPostingStatus: jobPosting.status,
        companyId: company.id,
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
      })
      .from(jobApplication)
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .innerJoin(user, eq(jobApplication.userId, user.id))
      .where(and(...baseFilters))
      .limit(1);

    if (!record) {
      return null;
    }

    const [candidateSkills, requiredSkills] = await Promise.all([
      this.findCandidateSkills(record.userId),
      this.findJobPostingSkills(record.jobPostingId),
    ]);

    return {
      id: record.id,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      user: {
        id: record.userId,
        name: record.userName,
        email: record.userEmail,
        image: record.userImage,
        skills: candidateSkills,
      },
      jobPosting: {
        id: record.jobPostingId,
        title: record.jobPostingTitle,
        description: record.jobPostingDescription,
        status: record.jobPostingStatus,
        company: {
          id: record.companyId,
          name: record.companyName,
          logoUrl: record.companyLogoUrl,
        },
        skills: requiredSkills,
      },
    };
  }

  private async findCandidateSkills(userId: string): Promise<CandidateSkillDetail[]> {
    return this.db
      .select({
        id: skill.id,
        name: skill.name,
        yearsOfExperience: userSkill.yearsOfExperience,
      })
      .from(userSkill)
      .innerJoin(skill, eq(userSkill.skillId, skill.id))
      .where(eq(userSkill.userId, userId))
      .orderBy(asc(skill.name));
  }

  private async findJobPostingSkills(jobPostingId: number): Promise<JobPostingSkillDetail[]> {
    return this.db
      .select({
        id: skill.id,
        name: skill.name,
        requiredYearsOfExperience: jobPostingSkill.yoe,
      })
      .from(jobPostingSkill)
      .innerJoin(skill, eq(jobPostingSkill.skillId, skill.id))
      .where(eq(jobPostingSkill.jobPostingId, jobPostingId))
      .orderBy(asc(skill.name));
  }
}
