import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { jobPosting, JobPosting, JobPostingInsert } from '../schema/job-posting.schema.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { GenericRepository } from './generic.repository.ts';
import { JOB_POSTING_STATUS } from '../util/constants.ts';
import { and, asc, desc, eq, getTableColumns, or, SQL } from 'drizzle-orm';
import { jobPostingSkill } from '../schema/job-posting-skill.schema.ts';
import skill from '../schema/skill.schema.ts';
import type { ActiveJobPostingsRequest } from '../../lib/zod/job-posting.zod-schema.ts';

@injectable()
export class JobPostingRepository extends GenericRepository<JobPosting, JobPostingInsert> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, jobPosting);
  }

  async findActiveJobPostings(
    companyId?: number,
    skills?: string[],
    orderBy: ActiveJobPostingsRequest['orderBy'] = 'createdAt',
    sort: ActiveJobPostingsRequest['sort'] = 'desc',
    page: number = 1,
    limit: number = 50,
  ): Promise<JobPosting[]> {
    const skip = (page - 1) * limit;
    let query = this.db.selectDistinct(getTableColumns(jobPosting)).from(jobPosting).$dynamic();
    const conditions: SQL[] = [eq(jobPosting.status, JOB_POSTING_STATUS.ACTIVE)];

    if (companyId) {
      conditions.push(eq(jobPosting.companyId, companyId));
    }

    if (skills?.length > 0) {
      const skillConditions: SQL[] = skills.map((slug) => {
        return eq(skill.slug, slug);
      });

      query = query
        .innerJoin(jobPostingSkill, eq(jobPostingSkill.jobPostingId, jobPosting.id))
        .innerJoin(skill, eq(jobPostingSkill.skillId, skill.id));

      conditions.push(or(...skillConditions));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (sort === 'desc') {
      query = query.orderBy(desc(jobPosting[orderBy]));
    } else if (sort === 'asc') {
      query = query.orderBy(asc(jobPosting[orderBy]));
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
