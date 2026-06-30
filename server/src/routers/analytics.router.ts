import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AnalyticsController } from '../controllers/analytics.controller.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';

export const getAnalyticsRouter = () => {
  const router = express.Router();
  const analyticsController = container.resolve<AnalyticsController>(TOKENS.analyticsController);

  router.get(
    '/overview',
    authGuard([USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER, USER_ROLE.ADMIN]),
    analyticsController.getOverview.bind(analyticsController),
  );

  return router;
};
