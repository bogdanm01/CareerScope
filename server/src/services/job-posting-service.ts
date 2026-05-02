import { injectable } from 'tsyringe';
import { Request } from 'express';

type AuthenticatedUser = Request['user'];

@injectable()
export class JobPostingService {
  async getAllJobPostings(query: Request['query']) {
    return {
      data: [],
      meta: {
        query,
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

  async createJobPosting(payload: unknown, user: AuthenticatedUser) {
    return {
      data: null,
      meta: {
        payload,
        userId: user?.id,
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
