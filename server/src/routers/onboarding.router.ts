import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { OnboardingController } from '../controllers/onboarding.controller.ts';

export const getOnboardingRouter = () => {
  const router = express.Router();
  const onboardingController = container.resolve<OnboardingController>(TOKENS.onboardingController);

  // POST /api/onboarding/recruiter
  router.post('/recruiter', onboardingController.registerRecruiter.bind(onboardingController));

  return router;
};
