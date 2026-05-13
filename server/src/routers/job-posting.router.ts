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

  router.get(
    '/',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobPostingController.getJobPostings.bind(jobPostingController),
  );

  router.get('/active', jobPostingController.getPublicJobPostings.bind(jobPostingController));

  router.post(
    '/:jobPostingId/applications',
    authGuard([USER_ROLE.CANDIDATE]),
    jobApplicationController.createJobApplication.bind(jobApplicationController),
  );

  // GET /api/job-postings/:jobPostingId/applications
  router.get(
    '/:id/applications',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobApplicationController.getJobApplications.bind(jobApplicationController),
  );

  router.get('/:id', optionalAuth, jobPostingController.getJobPostingById.bind(jobPostingController));

  router.post(
    '/',
    authGuard([USER_ROLE.RECRUITER]),
    jobPostingController.createJobPosting.bind(jobPostingController),
  );

  router.patch(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobPostingController.updateJobPosting.bind(jobPostingController),
  );

  router.delete(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobPostingController.deleteJobPosting.bind(jobPostingController),
  );

  return router;
};
