import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AnalyticsRepository } from '../data/repositories/analytics.repository.ts';
import { CompanyRepository } from '../data/repositories/company.repository.ts';
import { USER_ROLE, type UserRole } from '../data/util/constants.ts';
import { AnalyticsOverviewRequestSchema } from '../lib/zod/analytics.zod-schema.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { ForbiddenError, NotFoundError } from '../lib/app-error.ts';

type AnalyticsUser = {
  id: string;
  role: string;
  companyId?: number | null;
};

const toStartOfDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date;
};

const toEndOfDay = (value: string) => {
  const date = new Date(`${value}T23:59:59.999Z`);
  return date;
};

const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultFromDate = (today: Date) =>
  new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));

type ApplicationsOverTimeRecord = {
  date: string;
  applications?: number;
  [key: string]: unknown;
};

@injectable()
export class AnalyticsService {
  constructor(
    @inject(TOKENS.analyticsRepository) private analyticsRepository: AnalyticsRepository,
    @inject(TOKENS.companyRepository) private companyRepository: CompanyRepository,
  ) {}

  private async requireApprovedRecruiterCompany(companyId: number) {
    const companyApproval = await this.companyRepository.findApprovalStatus(companyId);

    if (!companyApproval?.isApproved) {
      throw new ForbiddenError('Company analytics are available after the company is approved by an admin.');
    }
  }

  private getRange(payload: unknown) {
    const validationResult = AnalyticsOverviewRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const today = new Date();
    const defaultFrom = getDefaultFromDate(today);
    const from = validationResult.data.from ? toStartOfDay(validationResult.data.from) : toStartOfDay(formatDateOnly(defaultFrom));
    const to = validationResult.data.to ? toEndOfDay(validationResult.data.to) : toEndOfDay(formatDateOnly(today));
    return { from, to, view: validationResult.data.view };
  }

  async getOverview(payload: unknown, user: AnalyticsUser) {
    const { view, ...range } = this.getRange(payload);
    const { from, to } = range;
    const role = user.role as UserRole;

    if (role === USER_ROLE.CANDIDATE) {
      const overview = await this.analyticsRepository.getCandidateOverview(user.id, range);
      return {
        data: {
          role,
          range: { from: formatDateOnly(from), to: formatDateOnly(to) },
          ...this.withDenseApplicationsOverTime(overview, range),
        },
      };
    }

    if (role === USER_ROLE.RECRUITER) {
      if (!user.companyId) {
        throw new ForbiddenError('Recruiter is not assigned to a company.');
      }

      await this.requireApprovedRecruiterCompany(user.companyId);

      const overview = await this.analyticsRepository.getRecruiterOverview(
        user.companyId,
        range,
        view ?? 'overview',
      );
      return {
        data: {
          role,
          range: { from: formatDateOnly(from), to: formatDateOnly(to) },
          ...this.withDenseApplicationsOverTime(overview, range),
        },
      };
    }

    if (role === USER_ROLE.ADMIN) {
      const overview = await this.analyticsRepository.getAdminOverview(range);
      return {
        data: {
          role,
          range: { from: formatDateOnly(from), to: formatDateOnly(to) },
          ...this.withDenseApplicationsOverTime(overview, range),
        },
      };
    }

    throw new ForbiddenError();
  }

  async getRecruiterJobPostingOverview(params: unknown, payload: unknown, user: AnalyticsUser) {
    const idValidationResult = IntegerIdSchema.safeParse(params);

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    if (user.role !== USER_ROLE.RECRUITER || !user.companyId) {
      throw new ForbiddenError();
    }

    await this.requireApprovedRecruiterCompany(user.companyId);

    const rangeWithView = this.getRange(payload);
    const range = { from: rangeWithView.from, to: rangeWithView.to };
    const { from, to } = range;
    const overview = await this.analyticsRepository.getRecruiterJobPostingOverview(
      user.companyId,
      idValidationResult.data.id,
      range,
    );

    if (!overview) {
      throw new NotFoundError('Job posting not found.');
    }

    return {
      data: {
        role: USER_ROLE.RECRUITER,
        range: { from: formatDateOnly(from), to: formatDateOnly(to) },
        ...this.withDenseApplicationsOverTime(overview, range),
      },
    };
  }

  private withDenseApplicationsOverTime<T extends { charts: Record<string, unknown> }>(
    overview: T,
    range: { from: Date; to: Date },
  ): T {
    const applicationsOverTime = overview.charts.applicationsOverTime;

    if (!Array.isArray(applicationsOverTime)) {
      return overview;
    }

    return {
      ...overview,
      charts: {
        ...overview.charts,
        applicationsOverTime: this.fillApplicationsOverTime(
          applicationsOverTime as ApplicationsOverTimeRecord[],
          range,
        ),
      },
    };
  }

  private fillApplicationsOverTime(
    records: ApplicationsOverTimeRecord[],
    range: { from: Date; to: Date },
  ): ApplicationsOverTimeRecord[] {
    if (records.length === 0) {
      return [];
    }

    const applicationsByDate = new Map(
      records.map((record) => [record.date, Number(record.applications ?? 0)]),
    );
    const results: ApplicationsOverTimeRecord[] = [];
    const current = new Date(Date.UTC(
      range.from.getUTCFullYear(),
      range.from.getUTCMonth(),
      range.from.getUTCDate(),
    ));
    const end = new Date(Date.UTC(
      range.to.getUTCFullYear(),
      range.to.getUTCMonth(),
      range.to.getUTCDate(),
    ));

    while (current.getTime() <= end.getTime()) {
      const date = formatDateOnly(current);
      results.push({
        date,
        applications: applicationsByDate.get(date) ?? 0,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return results;
  }
}
