import { inject, injectable } from 'tsyringe';
import { Request } from 'express';
import { JobPostingRepository } from '../data/repositories/job-posting.repository.ts';
import { JobPosting, JobPostingStatus } from '../data/schema/job-posting.schema.ts';
import { JOB_POSTING_STATUS, USER_ROLE } from '../data/util/constants.ts';
import { TOKENS } from '../config/dependency-tokens.ts';
import { JobPostingRequest } from '../lib/zod/job-posting.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { BadRequestError, ForbiddenError } from '../lib/app-error.ts';
import { ERROR_CODE } from '../lib/error-codes.ts';

type AuthenticatedUser = Request['user'];

@injectable()
export class JobPostingService {
  constructor(@inject(TOKENS.jobPostingRepository) private jobPostingRepository: JobPostingRepository) {}

  async createJobPosting(payload: unknown, user: AuthenticatedUser): Promise<JobPosting> {
    const validationResult = JobPostingRequest.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    if (!user?.companyId) {
      throw new ForbiddenError('Recruiter is not assigned to a company.', ERROR_CODE.RECRUITER_COMPANY_MISSING);
    }

    const newJobPosting = validationResult.data;
    const allowedCreateStatuses: JobPostingStatus[] = [JOB_POSTING_STATUS.DRAFT, JOB_POSTING_STATUS.PENDING_APPROVAL];

    if (!allowedCreateStatuses.includes(newJobPosting.status)) {
      throw new BadRequestError(
        'Invalid job posting status. Allowed statuses for creation are Draft and PendingApproval.',
        ERROR_CODE.INVALID_JOB_POSTING_STATUS,
      );
    }

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

  /**
   * {
   *   companyId: number,
   *   orderBy: string,
   *   sort: string,
   *   status: string,
   * }
   * @param payload
   */
  async getAllJobPostings(
    payload: { companyId?: number; status?: string },
    user?: AuthenticatedUser,
  ): Promise<JobPosting[]> {
    // TODO: Zod schema

    /**
     * unauthenticated user:
     * - can see active posts only
     * - can filter by company
     */

    let result = [];

    if (user) {
      if (user.role === USER_ROLE.ADMIN) {
        result = await this.jobPostingRepository.find({ status: JOB_POSTING_STATUS.ACTIVE });
      } else if (user.role === USER_ROLE.CANDIDATE) {
        result = await this.jobPostingRepository.find({ status: JOB_POSTING_STATUS.ACTIVE });
      } else if (user.role === USER_ROLE.RECRUITER) {
        result = await this.jobPostingRepository.find({ companyId: payload.companyId });
      }
    } else {
      result = await this.jobPostingRepository.findActiveJobPostings(payload.companyId);
    }

    return result;
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
