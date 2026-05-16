import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { authGuard } from '../middleware/auth-guard.ts';
import { USER_ROLE } from '../data/util/constants.ts';
import { JobApplicationController } from '../controllers/job-application.controller.ts';
import { MeController } from '../controllers/me.controller.ts';
import { cvUploadMiddleware } from '../middleware/cv-upload.middleware.ts';

export const getMeRouter = () => {
  const router = express.Router();
  const jobApplicationController = container.resolve<JobApplicationController>(TOKENS.jobApplicationController);
  const meController = container.resolve<MeController>(TOKENS.meController);

  router.get(
    '/applications',
    authGuard([USER_ROLE.CANDIDATE]),
    jobApplicationController.getMyJobApplications.bind(jobApplicationController),
  );

  router.get(
    '/applications/:id',
    authGuard([USER_ROLE.CANDIDATE]),
    jobApplicationController.getMyJobApplication.bind(jobApplicationController),
  );

  // PUT /api/me/skills
  router.put('/skills', authGuard([USER_ROLE.CANDIDATE]), meController.replaceCandidateSkills.bind(meController));

  // POST /api/me/cv
  router.post(
    '/cv',
    authGuard([USER_ROLE.CANDIDATE]),
    cvUploadMiddleware,
    meController.uploadCandidateCv.bind(meController),
  );

  return router;
};
