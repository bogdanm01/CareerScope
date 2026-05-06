import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { jobPosting, JobPosting, JobPostingInsert } from '../schema/job-posting.schema.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { GenericRepository } from './generic.repository.ts';
import { JOB_POSTING_STATUS } from '../util/constants.ts';
import { eq } from 'drizzle-orm';
import { jobPostingSkill } from '../schema/job-posting-skill.schema.ts';

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

  async insertWithSkills(
    payload: JobPostingInsert & {
      skills?: {
        skillId: number;
        yoe?: number;
      }[];
    },
  ): Promise<JobPosting> {
    return await this.db.transaction(async (tx) => {
      const { skills = [], ...jobPostingInsert } = payload;
      const [createdJobPosting] = await tx.insert(jobPosting).values(jobPostingInsert).returning();

      if (skills.length > 0) {
        await tx.insert(jobPostingSkill).values(
          skills.map((skill) => ({
            jobPostingId: createdJobPosting.id,
            skillId: skill.skillId,
            yoe: skill.yoe,
          })),
        );
      }

      return createdJobPosting;
    });
  }
}
