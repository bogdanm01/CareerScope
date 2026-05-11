import { TOKENS } from '../config/dependency-tokens.ts';
import { inject, injectable } from 'tsyringe';
import { JobApplicationService } from '../services/job-application.service.ts';
import { Request, Response } from 'express';

@injectable()
export class JobApplicationController {
  constructor(@inject(TOKENS.jobApplicationService) private jobApplicationService: JobApplicationService) {}

  createJobApplication = async (req: Request, res: Response) => {
    await this.jobApplicationService.createJobApplication(req.params.jobPostingId, req.body);
    res.status(201).send();
  };
}
