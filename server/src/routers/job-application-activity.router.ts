import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';
import { InterviewActivityController } from '../controllers/interview-activity.controller.ts';

export const getJobApplicationActivityRouter = () => {
  const router = express.Router();
  const interviewActivityController = container.resolve<InterviewActivityController>(TOKENS.interviewActivityController);

  router.patch(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    interviewActivityController.updateApplicationActivity.bind(interviewActivityController),
  );

  router.delete(
    '/:id',
    authGuard([USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    interviewActivityController.deleteApplicationActivity.bind(interviewActivityController),
  );

  return router;
};
