import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AnalyticsRepository } from '../data/repositories/analytics.repository.ts';
import { USER_ROLE, type UserRole } from '../data/util/constants.ts';
import { AnalyticsOverviewRequestSchema } from '../lib/zod/analytics.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { ForbiddenError } from '../lib/app-error.ts';

type AnalyticsUser = {
  id: string;
  role: string;
  companyId?: number | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toStartOfDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date;
};

const toEndOfDay = (value: string) => {
  const date = new Date(`${value}T23:59:59.999Z`);
  return date;
};

const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);

@injectable()
export class AnalyticsService {
  constructor(@inject(TOKENS.analyticsRepository) private analyticsRepository: AnalyticsRepository) {}

  async getOverview(payload: unknown, user: AnalyticsUser) {
    const validationResult = AnalyticsOverviewRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const today = new Date();
    const defaultFrom = new Date(today.getTime() - 29 * DAY_IN_MS);
    const from = validationResult.data.from ? toStartOfDay(validationResult.data.from) : toStartOfDay(formatDateOnly(defaultFrom));
    const to = validationResult.data.to ? toEndOfDay(validationResult.data.to) : toEndOfDay(formatDateOnly(today));
    const range = { from, to };
    const role = user.role as UserRole;

    if (role === USER_ROLE.CANDIDATE) {
      const overview = await this.analyticsRepository.getCandidateOverview(user.id, range);
      return {
        data: {
          role,
          range: { from: formatDateOnly(from), to: formatDateOnly(to) },
          ...overview,
        },
      };
    }

    if (role === USER_ROLE.RECRUITER) {
      if (!user.companyId) {
        throw new ForbiddenError('Recruiter is not assigned to a company.');
      }

      const overview = await this.analyticsRepository.getRecruiterOverview(user.companyId, range);
      return {
        data: {
          role,
          range: { from: formatDateOnly(from), to: formatDateOnly(to) },
          ...overview,
        },
      };
    }

    if (role === USER_ROLE.ADMIN) {
      const overview = await this.analyticsRepository.getAdminOverview(range);
      return {
        data: {
          role,
          range: { from: formatDateOnly(from), to: formatDateOnly(to) },
          ...overview,
        },
      };
    }

    throw new ForbiddenError();
  }
}
