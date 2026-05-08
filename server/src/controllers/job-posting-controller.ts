import { inject, injectable } from 'tsyringe';
import { JobPostingService } from '../services/job-posting-service.ts';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { ApiSuccessResponse, successResponse } from '../lib/api-response.ts';
import { JobPosting } from '../data/schema/job-posting.schema.ts';
import { JobPostingDetail, JobPostingListItem } from '../data/repositories/job-posting.repository.ts';

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

  // TODO: Add search by title
  // Public/candidate facing API
  getPublicJobPostings = async (req: Request, res: Response<ApiSuccessResponse<JobPostingListItem[]>>) => {
    const result = await this.jobPostingService.getPublicJobPostings(req.query);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  };

  getJobPostings = async (req: Request, res: Response<ApiSuccessResponse<JobPostingListItem[]>>) => {
    const result = await this.jobPostingService.getJobPostings(req.query, req.user);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  };

  // TODO: GET /api/job-postings/:id?include=skills,statusHistory
  getJobPostingById = async (
    req: Request<{ id: string }, undefined, undefined, { include?: string }>,
    res: Response<ApiSuccessResponse<JobPostingDetail>>,
  ) => {
    const result = await this.jobPostingService.getJobPostingById({
      id: req.params.id,
      include: req.query.include ?? undefined,
    });

    res.status(200).json(successResponse(result.data));
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
