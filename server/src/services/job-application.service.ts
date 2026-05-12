import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { JobApplicationRepository } from '../data/repositories/job-application.repository.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { JobApplicationCreateRequestSchema } from '../lib/zod/job-application.zod-schema.ts';
import { BadRequestError } from '../lib/app-error.ts';
import { JobPostingRepository } from '../data/repositories/job-posting.repository.ts';
import { jobPosting } from '../data/schema/job-posting.schema.ts';
import { and, eq } from 'drizzle-orm';
import { JOB_POSTING_STATUS } from '../data/util/constants.ts';
import { Request } from 'express';

type AuthenticatedUser = Request['user'];

@injectable()
export class JobApplicationService {
  constructor(
    @inject(TOKENS.jobApplicationRepository) private jobApplicationRepository: JobApplicationRepository,
    @inject(TOKENS.jobPostingRepository) private jobPostingRepository: JobPostingRepository,
  ) {}

  async createJobApplication(jobPostingId: unknown, payload: unknown, user: AuthenticatedUser): Promise<never> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: jobPostingId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const validationResult = JobApplicationCreateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const validJobPostingId = idValidationResult.data.id;

    // validate job posting (active, not expired, exists, not deleted)

    // jobPostingRepository.findJobPosting could also be used ?
    const record = await this.jobPostingRepository.findById(
      validJobPostingId,
      { id: jobPosting.id },
      and(eq(jobPosting.isDeleted, false), eq(jobPosting.status, JOB_POSTING_STATUS.ACTIVE)),
    );

    if (!record) {
      throw new BadRequestError(`No active job posting found with provided id.`);
    }

    // Save job application and job application status history

    throw new BadRequestError('Job application creation is not implemented yet.');
  }
}
