import { injectable } from 'tsyringe';
import { Request } from 'express';

type AuthenticatedUser = Request['user'];

@injectable()
export class JobPostingService {
  async getAll(query: Request['query']) {
    return {
      data: [],
      meta: {
        query,
      },
    };
  }

  async getById(id: string) {
    return {
      id,
    };
  }

  async getStatusHistory(jobPostingId: string) {
    return {
      data: [],
      meta: {
        jobPostingId,
      },
    };
  }

  async create(payload: unknown, user: AuthenticatedUser) {
    return {
      data: null,
      meta: {
        payload,
        userId: user?.id,
      },
    };
  }

  async update(id: string, payload: unknown, user: AuthenticatedUser) {
    return {
      id,
      data: null,
      meta: {
        payload,
        userId: user?.id,
      },
    };
  }

  async delete(id: string, user: AuthenticatedUser) {
    return {
      id,
      userId: user?.id,
    };
  }
}
