import express from 'express';
import { getJobPostingRouter } from './job-posting.router.ts';
import { getJobApplicationRouter } from './job-application.router.ts';
import { getMeRouter } from './me.router.ts';
import { getCompanyRouter } from './company.router.ts';
import { getOnboardingRouter } from './onboarding.router.ts';

export const getApiRouter = () => {
  const apiRouter = express.Router();

  apiRouter.use('/job-postings', getJobPostingRouter());
  apiRouter.use('/job-applications', getJobApplicationRouter());
  apiRouter.use('/me', getMeRouter());
  apiRouter.use('/companies', getCompanyRouter());
  apiRouter.use('/onboarding', getOnboardingRouter());

  return apiRouter;
};
