import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { jobPosting, JobPosting, JobPostingInsert } from '../schema/job-posting.schema.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { GenericRepository } from './generic.repository.ts';
import { JOB_POSTING_STATUS } from '../util/constants.ts';
import { eq } from 'drizzle-orm';

@injectable()
export class JobPostingRepository extends GenericRepository<JobPosting, JobPostingInsert> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, jobPosting);
  }

  async findActiveJobPostings(companyId: number, page: number = 1, limit: number = 50): Promise<JobPosting[]> {
    const skip = (page - 1) * limit;
    let query = this.db.select().from(jobPosting).$dynamic();

    query = query.where(eq(jobPosting.status, JOB_POSTING_STATUS.ACTIVE));

    if (companyId) {
      query = query.where(eq(jobPosting.companyId, companyId));
    }

    query = query.limit(limit);
    query = query.offset(skip);

    return query;
  }
}
