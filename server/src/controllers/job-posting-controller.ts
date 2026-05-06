import { inject, injectable } from 'tsyringe';
import { JobPostingService } from '../services/job-posting-service.ts';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { ApiSuccessResponse, successResponse } from '../lib/api-response.ts';
import { JobPosting } from '../data/schema/job-posting.schema.ts';

type JobPostingParams = {
  id: string;
};

@injectable()
export class JobPostingController {
  constructor(@inject(TOKENS.jobPostingService) private jobPostingService: JobPostingService) {}

  createJobPosting = async (req: Request, res: Response<ApiSuccessResponse<JobPosting>>) => {
    const result = await this.jobPostingService.createJobPosting(req.body, req.user);
    res.status(201).json(successResponse<JobPosting>(result));
  };

  getAllJobPostings = async (req: Request, res: Response) => {
    const payload = {
      companyId: req.query.companyId ? Number(req.query.companyId) : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    };

    const result = await this.jobPostingService.getAllJobPostings(payload, req.user);

    res.status(200).json(result);
  };

  getJobPostingById = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService.getJobPostingById(req.params.id);

    res.status(200).json(result);
  };

  getJobPostingStatusHistory = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService.getJobPostingStatusHistory(req.params.id);

    res.status(200).json(result);
  };

  updateJobPosting = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService.updateJobPosting(req.params.id, req.body, req.user);

    res.status(200).json(result);
  };

  deleteJobPosting = async (req: Request<JobPostingParams>, res: Response) => {
    await this.jobPostingService.deleteJobPosting(req.params.id, req.user);

    res.status(204).send();
  };
}
