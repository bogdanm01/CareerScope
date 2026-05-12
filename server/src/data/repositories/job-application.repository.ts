import { GenericRepository } from './generic.repository.ts';
import { jobApplication, JobApplication, JobApplicationInsert } from '../schema/job-application.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { applicationStatusHistory } from '../schema/application-status-history.schema.ts';

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
}
