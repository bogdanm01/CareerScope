/**
 * GET    /api/job-postings
 * GET    /api/job-postings/:id
 * POST   /api/job-postings              [RECRUITER]
 * PATCH  /api/job-postings/:id          [RECRUITER, ADMIN]
 * DELETE /api/job-postings/:id          [RECRUITER, ADMIN]
 * GET    /api/job-postings/:id/status-history [RECRUITER, ADMIN]
 */

import express from 'express';
import { JobPostingController } from '../controllers/job-posting-controller.ts';
import { JobPostingService } from '../services/job-posting-service.ts';

export const getJobPostingRouter = () => {
  const router = express.Router();
  const jobPostingController = new JobPostingController(new JobPostingService());

  router.get('/', jobPostingController.getAll);

  router.get('/:id', jobPostingController.getById);

  router.get('/:id/status-history', jobPostingController.getStatusHistory);

  router.post('/', jobPostingController.create);

  router.patch('/:id', jobPostingController.update);

  router.delete('/:id', jobPostingController.delete);

  return router;
};
