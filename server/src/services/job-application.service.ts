import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import {
  JobApplicationDetail,
  JobApplicationListItem,
  JobApplicationRepository,
} from '../data/repositories/job-application.repository.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import {
  JobApplicationCreateRequestSchema,
  JobApplicationListRequestSchema,
} from '../lib/zod/job-application.zod-schema.ts';
import { ConflictError, ForbiddenError, NotFoundError } from '../lib/app-error.ts';
import { JobPostingRepository } from '../data/repositories/job-posting.repository.ts';
import { jobPosting } from '../data/schema/job-posting.schema.ts';
import { and, eq, gte } from 'drizzle-orm';
import { JOB_APPLICATION_STATUS, JOB_POSTING_STATUS, USER_ROLE } from '../data/util/constants.ts';
import { Request } from 'express';
import { JobApplication } from '../data/schema/job-application.schema.ts';
import { ERROR_CODE } from '../lib/error-codes.ts';
import { PaginatedResult, SingleResult } from '../lib/api-response.ts';

type AuthenticatedUser = Request['user'];
const DUPLICATE_JOB_APPLICATION_CONSTRAINT = 'user_id_job_posting_id_unq';

@injectable()
export class JobApplicationService {
  constructor(
    @inject(TOKENS.jobApplicationRepository) private jobApplicationRepository: JobApplicationRepository,
    @inject(TOKENS.jobPostingRepository) private jobPostingRepository: JobPostingRepository,
  ) {}

  async createJobApplication(
    jobPostingId: unknown,
    payload: unknown,
    user: AuthenticatedUser,
  ): Promise<JobApplication> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: jobPostingId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const validationResult = JobApplicationCreateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const validJobPostingId = idValidationResult.data.id;

    const record = await this.jobPostingRepository.findById(
      validJobPostingId,
      { id: jobPosting.id },
      and(
        eq(jobPosting.isDeleted, false),
        eq(jobPosting.status, JOB_POSTING_STATUS.ACTIVE),
        gte(jobPosting.expiresAt, new Date()),
      ),
    );

    if (!record) {
      throw new NotFoundError(`No active job posting found with provided id.`);
    }

    try {
      return await this.jobApplicationRepository.insertWithStatusHistory({
        userId: user.id,
        jobPostingId: validJobPostingId,
        status: JOB_APPLICATION_STATUS.SUBMITTED,
      });
    } catch (error) {
      if (this.isDuplicateJobApplicationError(error)) {
        throw new ConflictError('You have already applied to this job posting.');
      }

      throw error;
    }
  }

  async getJobApplications(
    jobPostingId: unknown,
    payload: unknown,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<JobApplicationListItem>> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: jobPostingId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const validationResult = JobApplicationListRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const validJobPostingId = idValidationResult.data.id;
    const query = validationResult.data;

    const existingJobPosting = await this.jobPostingRepository.findById(
      validJobPostingId,
      { id: jobPosting.id, companyId: jobPosting.companyId },
      and(eq(jobPosting.isDeleted, false)),
    );

    if (!existingJobPosting) {
      throw new NotFoundError(`No job posting found with provided id.`);
    }

    if (user.role === USER_ROLE.RECRUITER && existingJobPosting.companyId !== user.companyId) {
      throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
    }

    const result = await this.jobApplicationRepository.findByJobPostingId(validJobPostingId, {
      page: query.page,
      pageSize: query.limit,
    });

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

  async getJobApplicationById(
    jobApplicationId: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<JobApplicationDetail>> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: jobApplicationId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    let companyId: number | undefined;

    if (user.role === USER_ROLE.RECRUITER) {
      if (!user.companyId) {
        throw new ForbiddenError('User is not assigned to a company.');
      }

      companyId = user.companyId;
    }

    const validId = idValidationResult.data.id;

    const result = await this.jobApplicationRepository.findJobApplication(validId, companyId);

    if (!result) {
      throw new NotFoundError(`No job application found with provided id.`);
    }

    return {
      data: result,
    };
  }

  private isDuplicateJobApplicationError(error: unknown): boolean {
    const cause = error instanceof Error ? error.cause : undefined;

    return (
      typeof cause === 'object' &&
      cause !== null &&
      'code' in cause &&
      cause.code === '23505' &&
      'constraint' in cause &&
      cause.constraint === DUPLICATE_JOB_APPLICATION_CONSTRAINT
    );
  }
}
