import express from 'express';
import { getJobPostingRouter } from './job-posting.router.ts';
import { getJobApplicationRouter } from './job-application.router.ts';
import { getMeRouter } from './me.router.ts';

export const getApiRouter = () => {
  const apiRouter = express.Router();

  apiRouter.use('/job-postings', getJobPostingRouter());
  apiRouter.use('/job-applications', getJobApplicationRouter());
  apiRouter.use('/me', getMeRouter());

  return apiRouter;
};
