import express from 'express';
import { JobPostingController } from '../controllers/job-posting.controller.ts';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';
import { optionalAuth } from '../middleware/optional-auth.ts';
import { JobApplicationController } from '../controllers/job-application.controller.ts';

export const getJobPostingRouter = () => {
  const router = express.Router();
  const jobPostingController = container.resolve<JobPostingController>(TOKENS.jobPostingController);
  const jobApplicationController = container.resolve<JobApplicationController>(TOKENS.jobApplicationController);

  router.get('/', authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]), jobPostingController.getJobPostings);

  router.get('/active', jobPostingController.getPublicJobPostings);

  router.post(
    '/:jobPostingId/applications',
    authGuard([USER_ROLE.CANDIDATE]),
    jobApplicationController.createJobApplication,
  );

  router.get('/:id', optionalAuth, jobPostingController.getJobPostingById);

  router.post('/', authGuard([USER_ROLE.RECRUITER]), jobPostingController.createJobPosting);

  router.patch('/:id', authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]), jobPostingController.updateJobPosting);

  router.delete(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobPostingController.deleteJobPosting.bind(jobPostingController),
  );

  return router;
};
