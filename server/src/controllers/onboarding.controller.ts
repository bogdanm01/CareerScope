import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { OnboardingService } from '../services/onboarding.service.ts';
import { successResponse } from '../lib/api-response.ts';

@injectable()
export class OnboardingController {
  constructor(@inject(TOKENS.onboardingService) private onboardingService: OnboardingService) {}

  async registerRecruiter(req: Request, res: Response) {
    const result = await this.onboardingService.registerRecruiter(req.body);
    res.status(201).send(successResponse(result.data));
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
