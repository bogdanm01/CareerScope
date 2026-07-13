import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import {
  ApplicationActivityInput,
  ApplicationActivityUpdateInput,
  ApplicationActivityAccess,
  ApplicationAccess,
  InterviewActivityRepository,
  PostingActivityTemplateInput,
} from '../data/repositories/interview-activity.repository.ts';
import { AuthenticatedUser } from '../data/util/utils.ts';
import { JOB_APPLICATION_ACTIVITY_STATUS, JOB_APPLICATION_STATUS, USER_ROLE } from '../data/util/constants.ts';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/app-error.ts';
import { ERROR_CODE } from '../lib/error-codes.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import {
  JobApplicationHiringStageCreateRequestSchema,
  JobApplicationHiringStageUpdateRequestSchema,
  JobPostingInterviewActivitiesUpdateRequestSchema,
} from '../lib/zod/job-posting.zod-schema.ts';
import { JobApplicationHiringStage } from '../data/schema/job-application-hiring-stage.schema.ts';
import { JobPostingHiringStage } from '../data/schema/job-posting-hiring-stage.schema.ts';
import { SingleResult } from '../lib/api-response.ts';

export type CandidateApplicationActivityView = Omit<JobApplicationHiringStage, 'internalNote'>;

@injectable()
export class InterviewActivityService {
  constructor(
    @inject(TOKENS.interviewActivityRepository)
    private interviewActivityRepository: InterviewActivityRepository,
  ) {}

  async getPostingActivities(
    jobPostingId: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<JobPostingHiringStage[]>> {
    const id = this.parseId(jobPostingId);
    await this.ensurePostingAccess(id, user);
    return { data: await this.interviewActivityRepository.findPostingTemplates(id) };
  }

  async replacePostingActivities(
    jobPostingId: unknown,
    payload: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<JobPostingHiringStage[]>> {
    const id = this.parseId(jobPostingId);
    const validationResult = JobPostingInterviewActivitiesUpdateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    await this.ensurePostingAccess(id, user);

    const activities = validationResult.data.interviewActivities.map((activity): PostingActivityTemplateInput => ({
      title: activity.title,
      description: activity.description,
      orderIndex: activity.orderIndex,
      isRequired: activity.isRequired,
    }));

    return { data: await this.interviewActivityRepository.replacePostingTemplates(id, activities) };
  }

  async getApplicationActivities(
    jobApplicationId: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<JobApplicationHiringStage[] | CandidateApplicationActivityView[]>> {
    const id = this.parseId(jobApplicationId);
    await this.ensureApplicationAccess(id, user);
    const activities = await this.interviewActivityRepository.findApplicationActivities(id);

    if (user.role === USER_ROLE.CANDIDATE) {
      return {
        data: activities.map((activity) => ({
          id: activity.id,
          jobApplicationId: activity.jobApplicationId,
          jobPostingHiringStageId: activity.jobPostingHiringStageId,
          title: activity.title,
          description: activity.description,
          orderIndex: activity.orderIndex,
          status: activity.status,
          scheduledAt: activity.scheduledAt,
          completedAt: activity.completedAt,
          isDeleted: activity.isDeleted,
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt,
        })),
      };
    }

    return { data: activities };
  }

  async createApplicationActivity(
    jobApplicationId: unknown,
    payload: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<JobApplicationHiringStage>> {
    const id = this.parseId(jobApplicationId);
    const validationResult = JobApplicationHiringStageCreateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const access = await this.ensureApplicationAccess(id, user, { candidateAllowed: false });
    this.ensureApplicationIsInterviewing(access.applicationStatus);

    return {
      data: await this.interviewActivityRepository.createApplicationActivity(
        id,
        this.normalizeActivityPayload(validationResult.data),
      ),
    };
  }

  async updateApplicationActivity(
    activityId: unknown,
    payload: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<JobApplicationHiringStage>> {
    const id = this.parseId(activityId);
    const validationResult = JobApplicationHiringStageUpdateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const existingActivity = await this.ensureActivityAccess(id, user);
    this.ensureApplicationIsInterviewing(existingActivity.applicationStatus);
    const updatedActivity = await this.interviewActivityRepository.updateApplicationActivity(
      id,
      this.normalizeActivityPayload(validationResult.data, existingActivity),
    );

    if (!updatedActivity) {
      throw new NotFoundError('Interview activity not found.');
    }

    return { data: updatedActivity };
  }

  async deleteApplicationActivity(
    activityId: unknown,
    user: AuthenticatedUser,
  ): Promise<SingleResult<{ id: number }>> {
    const id = this.parseId(activityId);
    const existingActivity = await this.ensureActivityAccess(id, user);
    this.ensureApplicationIsInterviewing(existingActivity.applicationStatus);
    const result = await this.interviewActivityRepository.deleteApplicationActivity(id);

    if (!result) {
      throw new NotFoundError('Interview activity not found.');
    }

    return { data: result };
  }

  private parseId(id: unknown): number {
    const validationResult = IntegerIdSchema.safeParse({ id });

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    return validationResult.data.id;
  }

  private async ensurePostingAccess(jobPostingId: number, user: AuthenticatedUser): Promise<void> {
    const companyId = await this.interviewActivityRepository.findPostingCompanyId(jobPostingId);

    if (!companyId) {
      throw new NotFoundError('Job posting not found.');
    }

    this.ensureCompanyScope(companyId, user);
  }

  private async ensureApplicationAccess(
    jobApplicationId: number,
    user: AuthenticatedUser,
    options: { candidateAllowed?: boolean } = {},
  ): Promise<ApplicationAccess> {
    const access = await this.interviewActivityRepository.findApplicationCompanyAndUser(jobApplicationId);

    if (!access) {
      throw new NotFoundError('Job application not found.');
    }

    if (user.role === USER_ROLE.CANDIDATE) {
      if (options.candidateAllowed === false || access.userId !== user.id || access.candidateDeletedAt) {
        throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
      }

      return access;
    }

    this.ensureCompanyScope(access.companyId, user);
    return access;
  }

  private async ensureActivityAccess(activityId: number, user: AuthenticatedUser): Promise<ApplicationActivityAccess> {
    const access = await this.interviewActivityRepository.findActivityCompanyAndUser(activityId);

    if (!access) {
      throw new NotFoundError('Interview activity not found.');
    }

    if (user.role === USER_ROLE.CANDIDATE) {
      throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
    }

    this.ensureCompanyScope(access.companyId, user);
    return access;
  }

  private ensureCompanyScope(companyId: number, user: AuthenticatedUser): void {
    if (user.role === USER_ROLE.ADMIN) {
      return;
    }

    if (user.role === USER_ROLE.RECRUITER && user.companyId === companyId) {
      return;
    }

    throw new ForbiddenError('User is not authorized to perform this action.', ERROR_CODE.FORBIDDEN);
  }

  private ensureApplicationIsInterviewing(status: string): void {
    if (status !== JOB_APPLICATION_STATUS.INTERVIEWING) {
      throw new BadRequestError('Interview activities can only be modified while the application is interviewing.');
    }
  }

  private normalizeActivityPayload<T extends ApplicationActivityInput | ApplicationActivityUpdateInput>(
    payload: T,
    existingActivity?: Pick<ApplicationActivityAccess, 'scheduledAt' | 'status'>,
  ): T {
    const normalized = { ...payload };

    const effectiveScheduledAt =
      normalized.scheduledAt !== undefined ? normalized.scheduledAt : existingActivity?.scheduledAt;
    const requestedStatus = normalized.status;
    const statusAllowsScheduleInference =
      requestedStatus === undefined ||
      requestedStatus === JOB_APPLICATION_ACTIVITY_STATUS.PENDING ||
      requestedStatus === JOB_APPLICATION_ACTIVITY_STATUS.SCHEDULED;

    if (statusAllowsScheduleInference) {
      normalized.status = effectiveScheduledAt
        ? JOB_APPLICATION_ACTIVITY_STATUS.SCHEDULED
        : JOB_APPLICATION_ACTIVITY_STATUS.PENDING;
    }

    if (normalized.status === JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED && normalized.completedAt === undefined) {
      normalized.completedAt = new Date();
    }

    if (normalized.status && normalized.status !== JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED) {
      normalized.completedAt = normalized.completedAt ?? null;
    }

    if (normalized.scheduledAt !== undefined && normalized.scheduledAt !== null && Number.isNaN(normalized.scheduledAt.getTime())) {
      throw new BadRequestError('scheduledAt must be a valid date.');
    }

    if (normalized.completedAt !== undefined && normalized.completedAt !== null && Number.isNaN(normalized.completedAt.getTime())) {
      throw new BadRequestError('completedAt must be a valid date.');
    }

    return normalized as T;
  }
}
