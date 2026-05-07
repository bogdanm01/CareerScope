import express from 'express';
import { JobPostingController } from '../controllers/job-posting-controller.ts';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';

/**
 * GET    /api/job-postings
 * GET    /api/job-postings/:id
 * POST   /api/job-postings              [RECRUITER]
 * PATCH  /api/job-postings/:id          [RECRUITER, ADMIN]
 * DELETE /api/job-postings/:id          [RECRUITER, ADMIN]
 * GET    /api/job-postings/:id/status-history [RECRUITER, ADMIN]
 */

export const getJobPostingRouter = () => {
  const router = express.Router();
  const jobPostingController = container.resolve<JobPostingController>(TOKENS.jobPostingController);

  router.get('/', jobPostingController.getAllJobPostings);

  router.get('/active', jobPostingController.getActiveJobPostings);

  router.get('/:id/status-history', jobPostingController.getJobPostingStatusHistory);

  router.get('/:id', jobPostingController.getJobPostingById);

  router.post('/', authGuard([USER_ROLE.RECRUITER]), jobPostingController.createJobPosting);

  router.patch('/:id', jobPostingController.updateJobPosting);

  router.delete('/:id', jobPostingController.deleteJobPosting);

  return router;
};
