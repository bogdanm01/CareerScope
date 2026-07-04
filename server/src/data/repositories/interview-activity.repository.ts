import { and, asc, eq, max, SQL } from 'drizzle-orm';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import {
  jobPostingActivityTemplate,
  JobPostingActivityTemplate,
  JobPostingActivityTemplateInsert,
} from '../schema/job-posting-activity-template.schema.ts';
import {
  jobApplicationActivity,
  JobApplicationActivity,
  JobApplicationActivityInsert,
} from '../schema/job-application-activity.schema.ts';
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

export type ApplicationActivityView = JobApplicationActivity & {
  candidateVisible: Omit<JobApplicationActivity, 'internalNote'>;
};

export type ApplicationActivityAccess = {
  companyId: number;
  userId: string;
  jobApplicationId: number;
  scheduledAt: Date | null;
  status: string;
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
  ): Promise<{ companyId: number; userId: string; candidateDeletedAt: Date | null } | null> {
    const [record] = await this.db
      .select({
        companyId: jobPosting.companyId,
        userId: jobApplication.userId,
        candidateDeletedAt: jobApplication.candidateDeletedAt,
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
        scheduledAt: jobApplicationActivity.scheduledAt,
        status: jobApplicationActivity.status,
      })
      .from(jobApplicationActivity)
      .innerJoin(jobApplication, eq(jobApplicationActivity.jobApplicationId, jobApplication.id))
      .innerJoin(jobPosting, eq(jobApplication.jobPostingId, jobPosting.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(
        and(
          eq(jobApplicationActivity.id, activityId),
          eq(jobApplicationActivity.isDeleted, false),
          eq(jobApplication.isDeleted, false),
          eq(jobPosting.isDeleted, false),
          eq(company.isDeleted, false),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async findPostingTemplates(jobPostingId: number): Promise<JobPostingActivityTemplate[]> {
    return this.db
      .select()
      .from(jobPostingActivityTemplate)
      .where(
        and(
          eq(jobPostingActivityTemplate.jobPostingId, jobPostingId),
          eq(jobPostingActivityTemplate.isDeleted, false),
        ),
      )
      .orderBy(asc(jobPostingActivityTemplate.orderIndex), asc(jobPostingActivityTemplate.id));
  }

  async replacePostingTemplates(
    jobPostingId: number,
    activities: PostingActivityTemplateInput[],
  ): Promise<JobPostingActivityTemplate[]> {
    return this.db.transaction(async (tx) => {
      await tx
        .update(jobPostingActivityTemplate)
        .set({ isDeleted: true })
        .where(
          and(
            eq(jobPostingActivityTemplate.jobPostingId, jobPostingId),
            eq(jobPostingActivityTemplate.isDeleted, false),
          ),
        );

      if (activities.length === 0) {
        return [];
      }

      return tx
        .insert(jobPostingActivityTemplate)
        .values(
          activities.map((activity): JobPostingActivityTemplateInsert => ({
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
  ): Promise<JobPostingActivityTemplate[]> {
    if (activities.length === 0) {
      return [];
    }

    return this.db
      .insert(jobPostingActivityTemplate)
      .values(
        activities.map((activity): JobPostingActivityTemplateInsert => ({
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
  ): Promise<JobApplicationActivity[]> {
    const templates = await this.findPostingTemplates(jobPostingId);

    if (templates.length === 0) {
      return [];
    }

    return this.db
      .insert(jobApplicationActivity)
      .values(
        templates.map((template): JobApplicationActivityInsert => ({
          jobApplicationId,
          templateActivityId: template.id,
          title: template.title,
          description: template.description,
          orderIndex: template.orderIndex,
          status: JOB_APPLICATION_ACTIVITY_STATUS.PENDING,
        })),
      )
      .returning();
  }

  async findApplicationActivities(jobApplicationId: number): Promise<JobApplicationActivity[]> {
    return this.db
      .select()
      .from(jobApplicationActivity)
      .where(
        and(
          eq(jobApplicationActivity.jobApplicationId, jobApplicationId),
          eq(jobApplicationActivity.isDeleted, false),
        ),
      )
      .orderBy(asc(jobApplicationActivity.orderIndex), asc(jobApplicationActivity.id));
  }

  async createApplicationActivity(
    jobApplicationId: number,
    payload: ApplicationActivityInput,
  ): Promise<JobApplicationActivity> {
    const orderIndex = payload.orderIndex ?? (await this.getNextApplicationActivityOrderIndex(jobApplicationId));
    const [record] = await this.db
      .insert(jobApplicationActivity)
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
  ): Promise<JobApplicationActivity | null> {
    const updatePayload: Partial<JobApplicationActivityInsert> = {};

    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.orderIndex !== undefined) updatePayload.orderIndex = payload.orderIndex;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.scheduledAt !== undefined) updatePayload.scheduledAt = payload.scheduledAt;
    if (payload.completedAt !== undefined) updatePayload.completedAt = payload.completedAt;
    if (payload.internalNote !== undefined) updatePayload.internalNote = payload.internalNote;

    const [record] = await this.db
      .update(jobApplicationActivity)
      .set(updatePayload)
      .where(and(eq(jobApplicationActivity.id, activityId), eq(jobApplicationActivity.isDeleted, false)))
      .returning();

    return record ?? null;
  }

  async deleteApplicationActivity(activityId: number): Promise<{ id: number } | null> {
    const [record] = await this.db
      .update(jobApplicationActivity)
      .set({ isDeleted: true })
      .where(and(eq(jobApplicationActivity.id, activityId), eq(jobApplicationActivity.isDeleted, false)))
      .returning({ id: jobApplicationActivity.id });

    return record ?? null;
  }

  private async getNextApplicationActivityOrderIndex(jobApplicationId: number): Promise<number> {
    const [record] = await this.db
      .select({ maxOrderIndex: max(jobApplicationActivity.orderIndex) })
      .from(jobApplicationActivity)
      .where(
        and(
          eq(jobApplicationActivity.jobApplicationId, jobApplicationId),
          eq(jobApplicationActivity.isDeleted, false),
        ) as SQL,
      );

    return (record?.maxOrderIndex ?? -1) + 1;
  }
}
