import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { CompanyController } from '../controllers/company.controller.ts';

export const getCompanyRouter = () => {
  const router = express.Router();
  const companyController = container.resolve<CompanyController>(TOKENS.companyController);

  router.get('/:id/job-postings', companyController.getPublicJobPostings.bind(companyController));

  router.get('/:id', companyController.getCompany.bind(companyController));

  return router;
};
