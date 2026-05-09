import { getJobPostingRouter } from './job-posting-router.ts';
import express from 'express';

export const getApiRouter = () => {
  const apiRouter = express.Router();

  apiRouter.use('/job-postings', getJobPostingRouter());

  return apiRouter;
};
