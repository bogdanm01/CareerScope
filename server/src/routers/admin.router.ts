import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AdminController } from '../controllers/admin.controller.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';

export const getAdminRouter = () => {
  const router = express.Router();
  const adminController = container.resolve<AdminController>(TOKENS.adminController);

  router.get('/companies', authGuard([USER_ROLE.ADMIN]), adminController.getCompanies.bind(adminController));
  router.get('/companies/:id', authGuard([USER_ROLE.ADMIN]), adminController.getCompany.bind(adminController));

  return router;
};
