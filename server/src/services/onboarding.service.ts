import { injectable } from 'tsyringe';
import { RecruiterOnboardingRequestSchema } from '../lib/zod/onboarding.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';

@injectable()
export class OnboardingService {
  async registerRecruiter(payload: unknown): Promise<never> {
    const validationResult = RecruiterOnboardingRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    throw new Error('Recruiter onboarding is not implemented yet.');
  }
}
