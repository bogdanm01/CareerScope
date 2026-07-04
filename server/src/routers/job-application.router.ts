import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';
import { JobApplicationController } from '../controllers/job-application.controller.ts';
import { InterviewActivityController } from '../controllers/interview-activity.controller.ts';

export const getJobApplicationRouter = () => {
  const router = express.Router();
  const jobApplicationController = container.resolve<JobApplicationController>(TOKENS.jobApplicationController);
  const interviewActivityController = container.resolve<InterviewActivityController>(TOKENS.interviewActivityController);

  router.post(
    '/:id/review',
    authGuard([USER_ROLE.CANDIDATE]),
    jobApplicationController.createApplicationReview.bind(jobApplicationController),
  );

  router.get(
    '/:id/cv',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    jobApplicationController.downloadCandidateCv.bind(jobApplicationController),
  );

  router.get(
    '/:id/activities',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    interviewActivityController.getApplicationActivities.bind(interviewActivityController),
  );

  router.post(
    '/:id/activities',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    interviewActivityController.createApplicationActivity.bind(interviewActivityController),
  );

  router.patch(
    '/activities/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    interviewActivityController.updateApplicationActivity.bind(interviewActivityController),
  );

  router.delete(
    '/activities/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    interviewActivityController.deleteApplicationActivity.bind(interviewActivityController),
  );

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
