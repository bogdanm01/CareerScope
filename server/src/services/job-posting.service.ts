import { inject, injectable } from 'tsyringe';
import { Request } from 'express';
import {
  JobPostingDetail,
  JobPostingListItem,
  JobPostingRepository,
} from '../data/repositories/job-posting.repository.ts';
import { jobPosting, JobPosting, JobPostingStatus } from '../data/schema/job-posting.schema.ts';
import { JOB_POSTING_STATUS, USER_ROLE, UserRole } from '../data/util/constants.ts';
import { TOKENS } from '../config/dependency-tokens.ts';
import {
  AdminJobPostingUpdateRequestSchema,
  JobPostingDetailRequestSchema,
  JobPostingInsertRequestSchema,
  JobPostingListRequestSchema,
  JobPostingReadyForApprovalSchema,
  RecruiterJobPostingUpdateRequest,
  RecruiterJobPostingUpdateRequestSchema,
} from '../lib/zod/job-posting.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/app-error.ts';
import { ERROR_CODE } from '../lib/error-codes.ts';
import { PaginatedResult, SingleResult } from '../lib/api-response.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { toEndOfDayUtc } from '../lib/date.ts';

type AuthenticatedUser = Request['user'];
type JobPostingSkillState = {
  skillId: number;
  yoe?: number;
};

const RECRUITER_ALLOWED_STATUS_TRANSITIONS: Partial<Record<JobPostingStatus, JobPostingStatus[]>> = {
  [JOB_POSTING_STATUS.DRAFT]: [JOB_POSTING_STATUS.PENDING_APPROVAL],
  [JOB_POSTING_STATUS.REJECTED]: [JOB_POSTING_STATUS.PENDING_APPROVAL],
  [JOB_POSTING_STATUS.ACTIVE]: [
    JOB_POSTING_STATUS.PAUSED,
    JOB_POSTING_STATUS.CLOSED,
    JOB_POSTING_STATUS.PENDING_APPROVAL,
  ],
  [JOB_POSTING_STATUS.PAUSED]: [JOB_POSTING_STATUS.ACTIVE, JOB_POSTING_STATUS.CLOSED],
};

const ADMIN_ALLOWED_STATUS_TRANSITIONS: Partial<Record<JobPostingStatus, JobPostingStatus[]>> = {
  [JOB_POSTING_STATUS.PENDING_APPROVAL]: [
    JOB_POSTING_STATUS.ACTIVE,
    JOB_POSTING_STATUS.REJECTED,
    JOB_POSTING_STATUS.CLOSED,
  ],
  [JOB_POSTING_STATUS.ACTIVE]: [JOB_POSTING_STATUS.CLOSED, JOB_POSTING_STATUS.PAUSED],
};

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
      expiresAt: toEndOfDayUtc(newJobPosting.expiresAt),
      skills: newJobPosting.skills,
    });
  }

  async getJobPostings(payload: unknown, user: AuthenticatedUser): Promise<PaginatedResult<JobPostingListItem>> {
    const validationResult = JobPostingListRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const query = validationResult.data;
    let companyId = query.companyId;

    if (user?.role === USER_ROLE.RECRUITER) {
      if (!user.companyId) {
        throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
      }

      companyId = user.companyId;
    }

    const result = await this.jobPostingRepository.findJobPostings(
      query.status,
      companyId,
      query.skills,
      query.orderBy,
      query.sort,
      query.page,
      query.limit,
      query.search,
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
    const validationResult = JobPostingListRequestSchema.safeParse(payload);

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
      query.search,
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

  async getJobPostingById(payload: unknown, user?: AuthenticatedUser): Promise<SingleResult<JobPostingDetail>> {
    const validationResult = JobPostingDetailRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const query = validationResult.data;
    const result = await this.jobPostingRepository.findJobPosting(query.id, query.include);

    if (!result) {
      throw new NotFoundError('Job posting not found.');
    }

    if (!this.canViewJobPostingDetail(result, user)) {
      throw new NotFoundError('Job posting not found.');
    }

    return {
      data: result,
    };
  }

  private canViewJobPostingDetail(jobPosting: JobPostingDetail, user?: AuthenticatedUser): boolean {
    if (jobPosting.status === JOB_POSTING_STATUS.ACTIVE) {
      return true;
    }

    if (user?.role === USER_ROLE.ADMIN) {
      return true;
    }

    return user?.role === USER_ROLE.RECRUITER && user.companyId === jobPosting.companyId;
  }

  async updateJobPosting(id: unknown, payload: unknown, user: AuthenticatedUser): Promise<JobPosting> {
    const idValidationResult = IntegerIdSchema.safeParse({ id });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    if (user.role === USER_ROLE.RECRUITER) {
      return await this.updateJobPostingAsRecruiter(idValidationResult.data.id, payload, user);
    }

    if (user.role === USER_ROLE.ADMIN) {
      return await this.updateJobPostingAsAdmin(idValidationResult.data.id, payload);
    }
  }

  private async updateJobPostingAsRecruiter(
    id: number,
    payload: unknown,
    user: NonNullable<AuthenticatedUser>,
  ): Promise<JobPosting> {
    const validationResult = RecruiterJobPostingUpdateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const existingJobPosting = await this.getExistingJobPostingForUpdate(id);

    if (existingJobPosting.companyId !== user.companyId) {
      throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
    }

    const updatePayload = validationResult.data;
    const hasContentChanges = this.hasJobPostingContentChanges(existingJobPosting, updatePayload);
    const nextStatus = this.getRecruiterNextStatus(
      existingJobPosting.status as JobPostingStatus,
      updatePayload,
      hasContentChanges,
    );

    this.validateStatusTransition(
      existingJobPosting.status as JobPostingStatus,
      nextStatus,
      RECRUITER_ALLOWED_STATUS_TRANSITIONS,
    );

    const nextSkills =
      updatePayload.skills ?? existingJobPosting.skills?.map((it) => ({ skillId: it.id, yoe: it.yoe ?? undefined }));

    if (nextStatus === JOB_POSTING_STATUS.PENDING_APPROVAL) {
      const approvalReadyValidationResult = JobPostingReadyForApprovalSchema.safeParse({
        title: updatePayload.title ?? existingJobPosting.title,
        description: updatePayload.description ?? existingJobPosting.description,
        expiresAt: updatePayload.expiresAt ?? existingJobPosting.expiresAt,
        skills: nextSkills,
      });

      if (!approvalReadyValidationResult.success) {
        throw new ZodValidationError(approvalReadyValidationResult.error);
      }
    }

    return await this.jobPostingRepository.updateWithSkillsAndStatusHistory(
      id,
      {
        title: updatePayload.title,
      description: updatePayload.description,
        expiresAt: updatePayload.expiresAt ? toEndOfDayUtc(updatePayload.expiresAt) : undefined,
        status: nextStatus,
        skills: updatePayload.skills,
        statusHistoryReason: this.getStatusHistoryReason(
          existingJobPosting.status as JobPostingStatus,
          nextStatus,
          USER_ROLE.RECRUITER,
        ),
      },
      existingJobPosting.status as JobPostingStatus,
    );
  }

  private async updateJobPostingAsAdmin(id: number, payload: unknown): Promise<JobPosting> {
    const validationResult = AdminJobPostingUpdateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const updatePayload = validationResult.data;
    const existingJobPosting = await this.getExistingJobPostingForUpdate(id);

    this.validateStatusTransition(
      existingJobPosting.status as JobPostingStatus,
      updatePayload.status,
      ADMIN_ALLOWED_STATUS_TRANSITIONS,
    );

    return await this.jobPostingRepository.updateWithSkillsAndStatusHistory(
      id,
      {
        status: updatePayload.status,
        statusHistoryReason: this.getStatusHistoryReason(
          existingJobPosting.status as JobPostingStatus,
          updatePayload.status,
          USER_ROLE.ADMIN,
          updatePayload.reason,
        ),
      },
      existingJobPosting.status as JobPostingStatus,
    );
  }

  private async getExistingJobPostingForUpdate(id: number): Promise<JobPostingDetail> {
    const existingJobPosting = await this.jobPostingRepository.findJobPosting(id, ['skills']);

    if (!existingJobPosting) {
      throw new NotFoundError('Job posting not found.');
    }

    return existingJobPosting;
  }

  private getRecruiterNextStatus(
    currentStatus: JobPostingStatus,
    payload: RecruiterJobPostingUpdateRequest,
    hasContentChanges: boolean,
  ): JobPostingStatus | undefined {
    if (currentStatus === JOB_POSTING_STATUS.ACTIVE && hasContentChanges) {
      if (payload.status === JOB_POSTING_STATUS.ACTIVE) {
        throw new BadRequestError('Active job posting content changes must be submitted for approval.');
      }

      if (payload.status === undefined) {
        return JOB_POSTING_STATUS.PENDING_APPROVAL;
      }
    }

    return payload.status;
  }

  private hasJobPostingContentChanges(
    existingJobPosting: JobPostingDetail,
    payload: RecruiterJobPostingUpdateRequest,
  ): boolean {
    if (payload.title !== undefined && payload.title !== existingJobPosting.title) {
      return true;
    }

    if (payload.description !== undefined && payload.description !== existingJobPosting.description) {
      return true;
    }

    if (
      payload.expiresAt !== undefined &&
      toEndOfDayUtc(payload.expiresAt).getTime() !== existingJobPosting.expiresAt?.getTime()
    ) {
      return true;
    }

    if (payload.skills !== undefined) {
      const existingSkills =
        existingJobPosting.skills?.map((skill) => ({
          skillId: skill.id,
          yoe: skill.yoe ?? undefined,
        })) ?? [];

      return !this.areJobPostingSkillsEqual(existingSkills, payload.skills);
    }

    return false;
  }

  private areJobPostingSkillsEqual(left: JobPostingSkillState[], right: JobPostingSkillState[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const leftBySkillId = new Map(left.map((skill) => [skill.skillId, skill.yoe ?? null]));

    return right.every((skill) => leftBySkillId.get(skill.skillId) === (skill.yoe ?? null));
  }

  private validateStatusTransition(
    currentStatus: JobPostingStatus,
    nextStatus: JobPostingStatus | undefined,
    allowedTransitions: Partial<Record<JobPostingStatus, JobPostingStatus[]>>,
  ): void {
    if (nextStatus === undefined || nextStatus === currentStatus) {
      return;
    }

    const allowedNextStatuses = allowedTransitions[currentStatus] ?? [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestError(`Invalid status transition from ${currentStatus} to ${nextStatus}.`);
    }
  }

  private getStatusHistoryReason(
    currentStatus: JobPostingStatus,
    nextStatus: JobPostingStatus | undefined,
    role: UserRole,
    providedReason?: string,
  ): string | undefined {
    if (nextStatus === undefined || nextStatus === currentStatus) return undefined;

    if (role === USER_ROLE.ADMIN && providedReason) return providedReason;

    if (currentStatus === JOB_POSTING_STATUS.ACTIVE && nextStatus === JOB_POSTING_STATUS.PENDING_APPROVAL)
      return 'Job posting edited and resubmitted for approval.';

    if (currentStatus === JOB_POSTING_STATUS.REJECTED && nextStatus === JOB_POSTING_STATUS.PENDING_APPROVAL)
      return 'Job posting resubmitted for approval.';

    if (nextStatus === JOB_POSTING_STATUS.PENDING_APPROVAL) return 'Job posting submitted for approval.';

    if (nextStatus === JOB_POSTING_STATUS.PAUSED) return 'Job posting paused by recruiter.';

    if (currentStatus === JOB_POSTING_STATUS.PAUSED && nextStatus === JOB_POSTING_STATUS.ACTIVE)
      return 'Job posting resumed by recruiter.';

    if (nextStatus === JOB_POSTING_STATUS.CLOSED) return `Job posting closed by ${role.toLowerCase()}.`;

    if (nextStatus === JOB_POSTING_STATUS.ACTIVE) return 'Job posting approved by admin.';

    if (nextStatus === JOB_POSTING_STATUS.REJECTED) return 'Job posting rejected by admin.';

    return undefined;
  }

  async deleteJobPosting(id: unknown, user: AuthenticatedUser): Promise<SingleResult<{ id: number }>> {
    const idValidationResult = IntegerIdSchema.safeParse({ id });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const validId = idValidationResult.data.id;

    const record = await this.jobPostingRepository.findById(validId, {
      companyId: jobPosting.companyId,
      isDeleted: jobPosting.isDeleted,
      status: jobPosting.status,
    });

    if (!record || record.isDeleted) {
      throw new NotFoundError('Job posting not found.');
    }

    if (user.role === USER_ROLE.RECRUITER) {
      if (record.companyId !== user.companyId) {
        throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
      }
    }

    if (record.status === JOB_POSTING_STATUS.ACTIVE) {
      throw new BadRequestError(`Can't delete active job posting. Close it or pause it first.`);
    }

    const result = await this.jobPostingRepository.softDelete(validId);

    return {
      data: result,
    };
  }
}
