import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';
import { JobApplicationController } from '../controllers/job-application.controller.ts';

export const getJobApplicationRouter = () => {
  const router = express.Router();
  const jobApplicationController = container.resolve<JobApplicationController>(TOKENS.jobApplicationController);

  router.get(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobApplicationController.getJobApplication.bind(jobApplicationController),
  );

  router.patch(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobApplicationController.updateJobApplication.bind(jobApplicationController),
  );

  return router;
};
