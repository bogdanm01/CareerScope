import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { OnboardingService } from '../services/onboarding.service.ts';
import { successResponse } from '../lib/api-response.ts';
import { BadRequestError } from '../lib/app-error.ts';
import { deleteCompanyLogoFile, toCompanyLogoUrl } from '../middleware/company-logo-upload.middleware.ts';

@injectable()
export class OnboardingController {
  constructor(@inject(TOKENS.onboardingService) private onboardingService: OnboardingService) {}

  async registerRecruiter(req: Request, res: Response) {
    const uploadedLogoUrl = req.file?.filename ? toCompanyLogoUrl(req.file.filename) : undefined;
    const payload = this.readRecruiterOnboardingPayload(req.body, uploadedLogoUrl);

    try {
      const result = await this.onboardingService.registerRecruiter(payload);
      res.status(201).send(successResponse(result.data));
    } catch (error) {
      await deleteCompanyLogoFile(uploadedLogoUrl);
      throw error;
    }
  }

  private readRecruiterOnboardingPayload(body: unknown, uploadedLogoUrl?: string) {
    if (!uploadedLogoUrl) {
      return body;
    }

    if (!body || typeof body !== 'object' || !('payload' in body)) {
      throw new BadRequestError('Recruiter onboarding payload is required.');
    }

    const rawPayload = (body as { payload?: unknown }).payload;

    if (typeof rawPayload !== 'string') {
      throw new BadRequestError('Recruiter onboarding payload must be valid JSON.');
    }

    try {
      const parsedPayload = JSON.parse(rawPayload) as Record<string, unknown>;
      const company = typeof parsedPayload.company === 'object' && parsedPayload.company !== null
        ? parsedPayload.company as Record<string, unknown>
        : {};

      return {
        ...parsedPayload,
        company: {
          ...company,
          logoUrl: uploadedLogoUrl,
        },
      };
    } catch {
      throw new BadRequestError('Recruiter onboarding payload must be valid JSON.');
    }
  }

  async getPendingRecruiterOnboardingRequests(req: Request, res: Response) {
    const result = await this.onboardingService.getPendingRecruiterOnboardingRequests(req.query);
    res.status(200).send(successResponse(result.data, undefined, result.pagination));
  }

  async approveRecruiterOnboarding(req: Request, res: Response) {
    const result = await this.onboardingService.approveRecruiterOnboarding(req.params.companyId);
    res.status(200).send(successResponse(result.data));
  }

  async rejectRecruiterOnboarding(req: Request, res: Response) {
    const result = await this.onboardingService.rejectRecruiterOnboarding(req.params.companyId, req.body);
    res.status(200).send(successResponse(result.data));
  }
}
