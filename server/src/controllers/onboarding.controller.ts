import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { OnboardingService } from '../services/onboarding.service.ts';

@injectable()
export class OnboardingController {
  constructor(@inject(TOKENS.onboardingService) private onboardingService: OnboardingService) {}

  async registerRecruiter(req: Request, res: Response) {
    await this.onboardingService.registerRecruiter(req.body);
    res.status(501).send();
  }
}
