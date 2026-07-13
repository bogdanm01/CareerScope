import { and, asc, count, eq, max, ne, SQL } from 'drizzle-orm';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import {
  jobPostingHiringStage,
  JobPostingHiringStage,
  JobPostingHiringStageInsert,
} from '../schema/job-posting-hiring-stage.schema.ts';
import {
  jobApplicationHiringStage,
  JobApplicationHiringStage,
  JobApplicationHiringStageInsert,
} from '../schema/job-application-hiring-stage.schema.ts';
import { jobPosting } from '../schema/job-posting.schema.ts';
import { jobApplication } from '../schema/job-application.schema.ts';
import { company } from '../schema/company.schema.ts';
import { JOB_APPLICATION_ACTIVITY_STATUS } from '../util/constants.ts';

export type PostingActivityTemplateInput = {
  title: string;
  description?: string | null;
  orderIndex: number;
  isRequired: boolean;
};

export type ApplicationActivityInput = {
  title: string;
  description?: string | null;
  orderIndex?: number;
  status?: string;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  internalNote?: string | null;
};

export type ApplicationActivityUpdateInput = Partial<ApplicationActivityInput>;

export type ApplicationActivityView = JobApplicationHiringStage & {
  candidateVisible: Omit<JobApplicationHiringStage, 'internalNote'>;
};

export type ApplicationActivityAccess = {
  companyId: number;
  userId: string;
  jobApplicationId: number;
  applicationStatus: string;
  scheduledAt: Date | null;
  status: string;
};

export type ApplicationAccess = {
  companyId: number;
  userId: string;
  candidateDeletedAt: Date | null;
  applicationStatus: string;
};

@injectable()
export class InterviewActivityRepository {
  constructor(@inject(TOKENS.db) private db: DbClient) {}

  async findPostingCompanyId(jobPostingId: number): Promise<number | null> {
    const [record] = await this.db
      .select({ companyId: jobPosting.companyId })
      .from(jobPosting)
      .where(and(eq(jobPosting.id, jobPostingId), eq(jobPosting.isDeleted, false)))
      .limit(1);

    return record?.companyId ?? null;
  }

  async findApplicationCompanyAndUser(
    jobApplicationId: number,
  ): Promise<ApplicationAccess | null> {
    const [record] = await this.db
      .select({
        companyId: jobPosting.companyId,
        userId: jobApplication.userId,
        candidateDeletedAt: jobApplication.candidateDeletedAt,
        applicationStatus: jobApplication.status,
      })
      .from(jobApplication)
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(
        and(
          eq(jobApplication.id, jobApplicationId),
          eq(jobApplication.isDeleted, false),
          eq(jobPosting.isDeleted, false),
          eq(company.isDeleted, false),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async findActivityCompanyAndUser(
    activityId: number,
  ): Promise<ApplicationActivityAccess | null> {
    const [record] = await this.db
      .select({
        companyId: jobPosting.companyId,
        userId: jobApplication.userId,
        jobApplicationId: jobApplication.id,
        applicationStatus: jobApplication.status,
        scheduledAt: jobApplicationHiringStage.scheduledAt,
        status: jobApplicationHiringStage.status,
      })
      .from(jobApplicationHiringStage)
      .innerJoin(jobApplication, eq(jobApplicationHiringStage.jobApplicationId, jobApplication.id))
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(
        and(
          eq(jobApplicationHiringStage.id, activityId),
          eq(jobApplicationHiringStage.isDeleted, false),
          eq(jobApplication.isDeleted, false),
          eq(jobPosting.isDeleted, false),
          eq(company.isDeleted, false),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async findPostingTemplates(jobPostingId: number): Promise<JobPostingHiringStage[]> {
    return this.db
      .select()
      .from(jobPostingHiringStage)
      .where(
        and(
          eq(jobPostingHiringStage.jobPostingId, jobPostingId),
          eq(jobPostingHiringStage.isDeleted, false),
        ),
      )
      .orderBy(asc(jobPostingHiringStage.orderIndex), asc(jobPostingHiringStage.id));
  }

  async replacePostingTemplates(
    jobPostingId: number,
    activities: PostingActivityTemplateInput[],
  ): Promise<JobPostingHiringStage[]> {
    return this.db.transaction(async (tx) => {
      await tx
        .update(jobPostingHiringStage)
        .set({ isDeleted: true })
        .where(
          and(
            eq(jobPostingHiringStage.jobPostingId, jobPostingId),
            eq(jobPostingHiringStage.isDeleted, false),
          ),
        );

      if (activities.length === 0) {
        return [];
      }

      return tx
        .insert(jobPostingHiringStage)
        .values(
          activities.map((activity): JobPostingHiringStageInsert => ({
            jobPostingId,
            title: activity.title,
            description: activity.description ?? null,
            orderIndex: activity.orderIndex,
            isRequired: activity.isRequired,
          })),
        )
        .returning();
    });
  }

  async insertPostingTemplates(
    jobPostingId: number,
    activities: PostingActivityTemplateInput[],
  ): Promise<JobPostingHiringStage[]> {
    if (activities.length === 0) {
      return [];
    }

    return this.db
      .insert(jobPostingHiringStage)
      .values(
        activities.map((activity): JobPostingHiringStageInsert => ({
          jobPostingId,
          title: activity.title,
          description: activity.description ?? null,
          orderIndex: activity.orderIndex,
          isRequired: activity.isRequired,
        })),
      )
      .returning();
  }

  async copyPostingTemplatesToApplication(
    jobPostingId: number,
    jobApplicationId: number,
  ): Promise<JobApplicationHiringStage[]> {
    const templates = await this.findPostingTemplates(jobPostingId);

    if (templates.length === 0) {
      return [];
    }

    return this.db
      .insert(jobApplicationHiringStage)
      .values(
        templates.map((template): JobApplicationHiringStageInsert => ({
          jobApplicationId,
          jobPostingHiringStageId: template.id,
          title: template.title,
          description: template.description,
          orderIndex: template.orderIndex,
          status: JOB_APPLICATION_ACTIVITY_STATUS.PENDING,
        })),
      )
      .returning();
  }

  async findApplicationActivities(jobApplicationId: number): Promise<JobApplicationHiringStage[]> {
    return this.db
      .select()
      .from(jobApplicationHiringStage)
      .where(
        and(
          eq(jobApplicationHiringStage.jobApplicationId, jobApplicationId),
          eq(jobApplicationHiringStage.isDeleted, false),
        ),
      )
      .orderBy(asc(jobApplicationHiringStage.orderIndex), asc(jobApplicationHiringStage.id));
  }

  async countIncompleteApplicationActivities(jobApplicationId: number): Promise<number> {
    const [record] = await this.db
      .select({ value: count() })
      .from(jobApplicationHiringStage)
      .where(
        and(
          eq(jobApplicationHiringStage.jobApplicationId, jobApplicationId),
          eq(jobApplicationHiringStage.isDeleted, false),
          ne(jobApplicationHiringStage.status, JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED),
        ),
      );

    return record?.value ?? 0;
  }

  async createApplicationActivity(
    jobApplicationId: number,
    payload: ApplicationActivityInput,
  ): Promise<JobApplicationHiringStage> {
    const orderIndex = payload.orderIndex ?? (await this.getNextApplicationActivityOrderIndex(jobApplicationId));
    const [record] = await this.db
      .insert(jobApplicationHiringStage)
      .values({
        jobApplicationId,
        title: payload.title,
        description: payload.description ?? null,
        orderIndex,
        status: payload.status ?? JOB_APPLICATION_ACTIVITY_STATUS.PENDING,
        scheduledAt: payload.scheduledAt ?? null,
        completedAt: payload.completedAt ?? null,
        internalNote: payload.internalNote ?? null,
      })
      .returning();

    return record;
  }

  async updateApplicationActivity(
    activityId: number,
    payload: ApplicationActivityUpdateInput,
  ): Promise<JobApplicationHiringStage | null> {
    const updatePayload: Partial<JobApplicationHiringStageInsert> = {};

    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.orderIndex !== undefined) updatePayload.orderIndex = payload.orderIndex;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.scheduledAt !== undefined) updatePayload.scheduledAt = payload.scheduledAt;
    if (payload.completedAt !== undefined) updatePayload.completedAt = payload.completedAt;
    if (payload.internalNote !== undefined) updatePayload.internalNote = payload.internalNote;

    const [record] = await this.db
      .update(jobApplicationHiringStage)
      .set(updatePayload)
      .where(and(eq(jobApplicationHiringStage.id, activityId), eq(jobApplicationHiringStage.isDeleted, false)))
      .returning();

    return record ?? null;
  }

  async deleteApplicationActivity(activityId: number): Promise<{ id: number } | null> {
    const [record] = await this.db
      .update(jobApplicationHiringStage)
      .set({ isDeleted: true })
      .where(and(eq(jobApplicationHiringStage.id, activityId), eq(jobApplicationHiringStage.isDeleted, false)))
      .returning({ id: jobApplicationHiringStage.id });

    return record ?? null;
  }

  private async getNextApplicationActivityOrderIndex(jobApplicationId: number): Promise<number> {
    const [record] = await this.db
      .select({ maxOrderIndex: max(jobApplicationHiringStage.orderIndex) })
      .from(jobApplicationHiringStage)
      .where(
        and(
          eq(jobApplicationHiringStage.jobApplicationId, jobApplicationId),
          eq(jobApplicationHiringStage.isDeleted, false),
        ) as SQL,
      );

    return (record?.maxOrderIndex ?? -1) + 1;
  }
}
