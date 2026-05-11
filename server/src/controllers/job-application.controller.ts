import { TOKENS } from '../config/dependency-tokens.ts';
import { inject, injectable } from 'tsyringe';
import { JobApplicationService } from '../services/job-application.service.ts';
import { Request, Response } from 'express';

@injectable()
export class JobApplicationController {
  constructor(@inject(TOKENS.jobApplicationService) private jobApplicationService: JobApplicationService) {}

  createJobApplication = async (_req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Job application creation is not implemented yet.',
    });
  };
}
