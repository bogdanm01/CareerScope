import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { jobPosting, JobPosting, JobPostingInsert, JobPostingStatus } from '../schema/job-posting.schema.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { GenericRepository } from './generic.repository.ts';
import { and, asc, countDistinct, desc, eq, getTableColumns, ilike, or, SQL } from 'drizzle-orm';
import { jobPostingSkill } from '../schema/job-posting-skill.schema.ts';
import skill from '../schema/skill.schema.ts';
import type { JobPostingDetailInclude, JobPostingListRequest } from '../../lib/zod/job-posting.zod-schema.ts';
import { company } from '../schema/company.schema.ts';
import { jobPostingStatusHistory } from '../schema/job-posting-status-history.schema.ts';
import type { SelectedFields } from 'drizzle-orm/pg-core/query-builders/select.types';

type FindJobPostingsResult = {
  data: JobPostingListItem[];
  totalItems: number;
};

export type JobPostingListItem = Omit<JobPosting, 'companyId' | 'description' | 'isDeleted'> & {
  company: {
    id: number;
    name: string;
    logo: string | null;
  };
};

export type JobPostingDetail = Omit<JobPosting, 'isDeleted'> & {
  company?: {
    id: number;
    name: string;
    logo: string | null;
  };
  skills?: {
    id: number;
    name: string;
    yoe: number | null;
  }[];
  statusHistory?: {
    id: number;
    status: string;
    reason: string | null;
    createdAt: Date;
  }[];
};

type JobPostingCompanySelection = {
  id: number;
  name: string;
  logo: string | null;
};

type JobPostingSkillSelection = {
  id: number;
  name: string;
  yoe: number | null;
};

type JobPostingStatusHistorySelection = {
  id: number;
  status: string;
  reason: string | null;
  createdAt: Date;
};

type JobPostingDetailRow = JobPosting & {
  company?: JobPostingCompanySelection;
  skill?: JobPostingSkillSelection | null;
  statusHistory?: JobPostingStatusHistorySelection | null;
};

type JobPostingDetailQuery = {
  innerJoin(table: unknown, on: SQL): JobPostingDetailQuery;
  leftJoin(table: unknown, on: SQL): JobPostingDetailQuery;
  where(condition: SQL): Promise<JobPostingDetailRow[]>;
};

type JobPostingDetailJoinFn = (query: JobPostingDetailQuery) => JobPostingDetailQuery;

type JobPostingDetailIncludeFlags = {
  company: boolean;
  skills: boolean;
  statusHistory: boolean;
};

type JobPostingSkillUpdate = {
  skillId: number;
  yoe?: number;
};

type JobPostingUpdateWithSkillsPayload = {
  title?: string;
  description?: string;
  expiresAt?: Date;
  status?: JobPostingStatus;
  skills?: JobPostingSkillUpdate[];
  statusHistoryReason?: string;
};

@injectable()
export class JobPostingRepository extends GenericRepository<JobPosting, JobPostingInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, jobPosting);
  }

  async findJobPostings(
    status?: JobPostingStatus,
    companyId?: number,
    skills?: string[],
    orderBy: JobPostingListRequest['orderBy'] = 'createdAt',
    sort: JobPostingListRequest['sort'] = 'desc',
    page: number = 1,
    limit: number = 50,
    search?: string,
  ): Promise<FindJobPostingsResult> {
    const skip = (page - 1) * limit;
    const jobPostingSelectColumns = {
      id: jobPosting.id,
      title: jobPosting.title,
      status: jobPosting.status,
      expiresAt: jobPosting.expiresAt,
      createdBy: jobPosting.createdBy,
      createdAt: jobPosting.createdAt,
      updatedAt: jobPosting.updatedAt,
    };

    let query = this.db
      .selectDistinct({
        ...jobPostingSelectColumns,
        company: {
          id: company.id,
          name: company.name,
          logo: company.logoUrl,
        },
      })
      .from(jobPosting)
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .$dynamic();

    let countQuery = this.db
      .select({ totalItems: countDistinct(jobPosting.id) })
      .from(jobPosting)
      .$dynamic();

    const conditions: SQL[] = [eq(jobPosting.isDeleted, false)];

    if (status) {
      conditions.push(eq(jobPosting.status, status));
    }

    if (companyId) {
      conditions.push(eq(jobPosting.companyId, companyId));
    }

    if (search) {
      conditions.push(ilike(jobPosting.title, `%${search}%`));
    }

    if (skills?.length > 0) {
      const skillConditions: SQL[] = skills.map((slug) => {
        return eq(skill.slug, slug);
      });

      query = query
        .innerJoin(jobPostingSkill, eq(jobPostingSkill.jobPostingId, jobPosting.id))
        .innerJoin(skill, eq(jobPostingSkill.skillId, skill.id));

      countQuery = countQuery
        .innerJoin(jobPostingSkill, eq(jobPostingSkill.jobPostingId, jobPosting.id))
        .innerJoin(skill, eq(jobPostingSkill.skillId, skill.id));

      conditions.push(or(...skillConditions));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    if (sort === 'desc') {
      query = query.orderBy(desc(jobPosting[orderBy]));
    } else if (sort === 'asc') {
      query = query.orderBy(asc(jobPosting[orderBy]));
    }

    query = query.limit(limit);
    query = query.offset(skip);

    const [data, [countResult]] = await Promise.all([query, countQuery]);

    return {
      data,
      totalItems: countResult?.totalItems ?? 0,
    };
  }

  async findJobPosting(id: number, include: JobPostingDetailInclude[] = []): Promise<JobPostingDetail | undefined> {
    const idFilter = and(eq(jobPosting.id, id), eq(jobPosting.isDeleted, false)) as SQL;

    const includeFlags = this.getJobPostingDetailIncludeFlags(include);
    const selectFields = this.getJobPostingDetailSelectFields(includeFlags);

    const baseQuery = this.db.select(selectFields).from(jobPosting).$dynamic() as unknown as JobPostingDetailQuery;
    const query = this.applyJobPostingDetailIncludes(baseQuery, include);

    const rows = await query.where(idFilter);
    return this.mapJobPostingDetail(rows, includeFlags);
  }

  private getJobPostingDetailIncludeFlags(include: JobPostingDetailInclude[]): JobPostingDetailIncludeFlags {
    return {
      company: include.includes('company'),
      skills: include.includes('skills'),
      statusHistory: include.includes('statusHistory'),
    };
  }

  private getJobPostingDetailSelectFields(include: JobPostingDetailIncludeFlags): SelectedFields {
    const selectFields: SelectedFields = {
      ...getTableColumns(jobPosting),
    };

    if (include.company) {
      selectFields.company = {
        id: company.id,
        name: company.name,
        logo: company.logoUrl,
        websiteUrl: company.websiteUrl,
        shortDescription: company.shortDescription,
        address: company.address,
      };
    }

    if (include.skills) {
      selectFields.skill = {
        id: skill.id,
        name: skill.name,
        yoe: jobPostingSkill.yoe,
      };
    }

    if (include.statusHistory) {
      selectFields.statusHistory = {
        id: jobPostingStatusHistory.id,
        status: jobPostingStatusHistory.status,
        reason: jobPostingStatusHistory.reason,
        createdAt: jobPostingStatusHistory.createdAt,
      };
    }

    return selectFields;
  }

  private applyJobPostingDetailIncludes(
    query: JobPostingDetailQuery,
    include: JobPostingDetailInclude[],
  ): JobPostingDetailQuery {
    const includeJoinFn: Record<JobPostingDetailInclude, JobPostingDetailJoinFn> = {
      company: (query) => query.innerJoin(company, eq(company.id, jobPosting.companyId)),
      skills: (query) =>
        query
          .leftJoin(jobPostingSkill, eq(jobPostingSkill.jobPostingId, jobPosting.id))
          .leftJoin(skill, eq(jobPostingSkill.skillId, skill.id)),
      statusHistory: (query) =>
        query.leftJoin(jobPostingStatusHistory, eq(jobPostingStatusHistory.jobPostingId, jobPosting.id)),
    };

    return include.reduce((currentQuery, includeValue) => includeJoinFn[includeValue](currentQuery), query);
  }

  private mapJobPostingDetail(
    rows: JobPostingDetailRow[],
    include: JobPostingDetailIncludeFlags,
  ): JobPostingDetail | undefined {
    const firstRow = rows[0];

    if (!firstRow) {
      return undefined;
    }

    const result: JobPostingDetail = {
      id: firstRow.id,
      companyId: firstRow.companyId,
      title: firstRow.title,
      description: firstRow.description,
      status: firstRow.status,
      expiresAt: firstRow.expiresAt,
      createdBy: firstRow.createdBy,
      createdAt: firstRow.createdAt,
      updatedAt: firstRow.updatedAt,
    };

    if (include.company) result.company = firstRow.company;
    if (include.skills) result.skills = this.mapJobPostingDetailSkills(rows);
    if (include.statusHistory) result.statusHistory = this.mapJobPostingDetailStatusHistory(rows);

    return result;
  }

  private mapJobPostingDetailSkills(rows: JobPostingDetailRow[]): JobPostingSkillSelection[] {
    const skillsById = new Map<number, JobPostingSkillSelection>();

    for (const row of rows) {
      if (row.skill?.id) {
        skillsById.set(row.skill.id, row.skill);
      }
    }

    return [...skillsById.values()];
  }

  private mapJobPostingDetailStatusHistory(rows: JobPostingDetailRow[]): JobPostingStatusHistorySelection[] {
    const statusHistoryById = new Map<number, JobPostingStatusHistorySelection>();

    for (const row of rows) {
      if (row.statusHistory?.id) {
        statusHistoryById.set(row.statusHistory.id, row.statusHistory);
      }
    }

    return [...statusHistoryById.values()];
  }

  async updateWithSkillsAndStatusHistory(
    id: number,
    payload: JobPostingUpdateWithSkillsPayload,
    currentStatus: JobPostingStatus,
  ): Promise<JobPosting> {
    return await this.db.transaction(async (tx) => {
      const jobPostingUpdate: Partial<JobPostingInsert> = {};

      if (payload.title !== undefined) {
        jobPostingUpdate.title = payload.title;
      }

      if (payload.description !== undefined) {
        jobPostingUpdate.description = payload.description;
      }

      if (payload.expiresAt !== undefined) {
        jobPostingUpdate.expiresAt = payload.expiresAt;
      }

      if (payload.status !== undefined) {
        jobPostingUpdate.status = payload.status;
      }

      if (Object.keys(jobPostingUpdate).length > 0) {
        await tx.update(jobPosting).set(jobPostingUpdate).where(eq(jobPosting.id, id));
      }

      if (payload.skills !== undefined) {
        await tx.delete(jobPostingSkill).where(eq(jobPostingSkill.jobPostingId, id));

        if (payload.skills.length > 0) {
          await tx.insert(jobPostingSkill).values(
            payload.skills.map((skill) => ({
              jobPostingId: id,
              skillId: skill.skillId,
              yoe: skill.yoe,
            })),
          );
        }
      }

      if (payload.status !== undefined && payload.status !== currentStatus) {
        await tx.insert(jobPostingStatusHistory).values({
          jobPostingId: id,
          status: payload.status,
          reason: payload.statusHistoryReason,
        });
      }

      const [updatedJobPosting] = await tx.select().from(jobPosting).where(eq(jobPosting.id, id)).limit(1);
      return updatedJobPosting;
    });
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

      await tx.insert(jobPostingStatusHistory).values({
        jobPostingId: createdJobPosting.id,
        status: createdJobPosting.status,
      });

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
