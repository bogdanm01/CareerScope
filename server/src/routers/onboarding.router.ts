import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { OnboardingController } from '../controllers/onboarding.controller.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';

export const getOnboardingRouter = () => {
  const router = express.Router();
  const onboardingController = container.resolve<OnboardingController>(TOKENS.onboardingController);

  // POST /api/onboarding/recruiter
  router.post('/recruiter', onboardingController.registerRecruiter.bind(onboardingController));

  router.get(
    '/recruiter/pending',
    authGuard([USER_ROLE.ADMIN]),
    onboardingController.getPendingRecruiterOnboardingRequests.bind(onboardingController),
  );

  router.post(
    '/recruiter/:companyId/approve',
    authGuard([USER_ROLE.ADMIN]),
    onboardingController.approveRecruiterOnboarding.bind(onboardingController),
  );

  router.post(
    '/recruiter/:companyId/reject',
    authGuard([USER_ROLE.ADMIN]),
    onboardingController.rejectRecruiterOnboarding.bind(onboardingController),
  );

  return router;
};
