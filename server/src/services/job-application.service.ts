import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { JobApplicationRepository } from '../data/repositories/job-application.repository.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { JobApplicationCreateRequestSchema } from '../lib/zod/job-application.zod-schema.ts';
import { BadRequestError } from '../lib/app-error.ts';

@injectable()
export class JobApplicationService {
  constructor(@inject(TOKENS.jobApplicationRepository) private jobApplicationRepository: JobApplicationRepository) {}

  async createJobApplication(jobPostingId: unknown, payload: unknown): Promise<never> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: jobPostingId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const validationResult = JobApplicationCreateRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    throw new BadRequestError('Job application creation is not implemented yet.');
  }
}
