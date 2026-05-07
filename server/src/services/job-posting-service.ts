import { inject, injectable } from 'tsyringe';
import { Request } from 'express';
import { JobPostingListItem, JobPostingRepository } from '../data/repositories/job-posting.repository.ts';
import { JobPosting } from '../data/schema/job-posting.schema.ts';
import { JOB_POSTING_STATUS, USER_ROLE } from '../data/util/constants.ts';
import { TOKENS } from '../config/dependency-tokens.ts';
import {
  ActiveJobPostingsRequestSchema,
  JobPostingInsertRequestSchema,
  JobPostingsRequestSchema,
} from '../lib/zod/job-posting.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { ForbiddenError } from '../lib/app-error.ts';
import { ERROR_CODE } from '../lib/error-codes.ts';
import { PaginatedResult } from '../lib/api-response.ts';

type AuthenticatedUser = Request['user'];

@injectable()
export class JobPostingService {
  constructor(@inject(TOKENS.jobPostingRepository) private jobPostingRepository: JobPostingRepository) {}

  async createJobPosting(payload: unknown, user: AuthenticatedUser): Promise<JobPosting> {
    const validationResult = JobPostingInsertRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    if (!user?.companyId) {
      throw new ForbiddenError('Recruiter is not assigned to a company.', ERROR_CODE.RECRUITER_COMPANY_MISSING);
    }

    const newJobPosting = validationResult.data;

    return await this.jobPostingRepository.insertWithSkills({
      companyId: user.companyId,
      title: newJobPosting.title,
      description: newJobPosting.description,
      status: newJobPosting.status,
      createdBy: user.id,
      expiresAt: newJobPosting.expiresAt,
      skills: newJobPosting.skills,
    });
  }

  async getJobPostings(payload: unknown, user: AuthenticatedUser): Promise<PaginatedResult<JobPostingListItem>> {
    const validationResult = JobPostingsRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const query = validationResult.data;
    let companyId = query.companyId;

    if (user?.role === USER_ROLE.RECRUITER) {
      if (!user.companyId) {
        throw new ForbiddenError('Recruiter is not assigned to a company.', ERROR_CODE.RECRUITER_COMPANY_MISSING);
      }

      companyId = user.companyId;
    }

    const result = await this.jobPostingRepository.findJobPostings(
      query.status,
      companyId,
      undefined,
      query.orderBy,
      query.sort,
      query.page,
      query.limit,
    );

    return {
      data: result.data,
      pagination: {
        currentPage: query.page,
        pageSize: query.limit,
        totalPages: Math.ceil(result.totalItems / query.limit),
        totalItems: result.totalItems,
      },
    };
  }

  async getPublicJobPostings(payload: unknown): Promise<PaginatedResult<JobPostingListItem>> {
    const validationResult = ActiveJobPostingsRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const query = validationResult.data;

    const result = await this.jobPostingRepository.findJobPostings(
      JOB_POSTING_STATUS.ACTIVE,
      query.companyId,
      query.skills,
      query.orderBy,
      query.sort,
      query.page,
      query.limit,
    );

    return {
      data: result.data,
      pagination: {
        currentPage: query.page,
        pageSize: query.limit,
        totalPages: Math.ceil(result.totalItems / query.limit),
        totalItems: result.totalItems,
      },
    };
  }

  async getJobPostingById(id: string) {
    return {
      id,
    };
  }

  async getJobPostingStatusHistory(jobPostingId: string) {
    return {
      data: [],
      meta: {
        jobPostingId,
      },
    };
  }

  async updateJobPosting(id: string, payload: unknown, user: AuthenticatedUser) {
    return {
      id,
      data: null,
      meta: {
        payload,
        userId: user?.id,
      },
    };
  }

  async deleteJobPosting(id: string, user: AuthenticatedUser) {
    return {
      id,
      userId: user?.id,
    };
  }
}
