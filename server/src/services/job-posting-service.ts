import { inject, injectable } from 'tsyringe';
import { Request } from 'express';
import { JobPostingRepository } from '../data/repositories/job-posting.repository.ts';
import { JobPosting } from '../data/schema/job-posting.schema.ts';
import { JOB_POSTING_STATUS, USER_ROLE } from '../data/util/constants.ts';
import { TOKENS } from '../config/dependency-tokens.ts';

type AuthenticatedUser = Request['user'];

@injectable()
export class JobPostingService {
  constructor(@inject(TOKENS.jobPostingRepository) private jobPostingRepository: JobPostingRepository) {}

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

  // Recruiter only
  async createJobPosting(
    payload: { companyId: number; title: string; description: string; status: string },
    user: AuthenticatedUser,
  ) {
    // TODO: Validation

    console.log(payload);

    return await this.jobPostingRepository.insert({
      expiresAt: new Date(),
      companyId: payload.companyId,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      createdBy: 'LxuNc0TZpQ2C2eLy78INOexQGq7yJ8lj',
    });
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
