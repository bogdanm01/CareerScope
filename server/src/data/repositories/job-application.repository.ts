import { GenericRepository } from './generic.repository.ts';
import { jobApplication, JobApplication, JobApplicationInsert } from '../schema/job-application.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { applicationStatusHistory } from '../schema/application-status-history.schema.ts';
import { count, eq, sql } from 'drizzle-orm';
import { user } from '../schema/auth.schema.ts';

type FindByJobPostingPagination = {
  page?: number;
  pageSize?: number;
};

type FindByJobPostingResult = {
  data: JobApplicationListItem[];
  totalItems: number;
};

export type JobApplicationListItem = JobApplication & {
  user: {
    fullName: string;
    email: string;
    image: string | null;
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
}
