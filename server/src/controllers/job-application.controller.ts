import { TOKENS } from '../config/dependency-tokens.ts';
import { inject, injectable } from 'tsyringe';
import { JobApplicationService } from '../services/job-application.service.ts';
import { Request, Response } from 'express';
import { successResponse } from '../lib/api-response.ts';
import { JobApplication } from '../data/schema/job-application.schema.ts';

@injectable()
export class JobApplicationController {
  constructor(@inject(TOKENS.jobApplicationService) private jobApplicationService: JobApplicationService) {}

  /**
   * Creates a job application for the authenticated candidate.
   *
   * The service validates the job posting id, rejects client-provided status
   * values, verifies that the target posting is active, and creates the
   * application with its initial status history.
   *
   * @param req Express request containing the job posting id, creation payload, and authenticated user.
   * @param res Express response returning the created job application.
   */
  createJobApplication = async (req: Request, res: Response) => {
    const result = await this.jobApplicationService.createJobApplication(req.params.jobPostingId, req.body, req.user);
    res.status(201).send(successResponse<JobApplication>(result, 'Job application created'));
  };
}
