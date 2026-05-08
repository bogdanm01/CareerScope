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

  /**
   *
   * @param req
   * @param res
   */
  createJobPosting = async (req: Request, res: Response<ApiSuccessResponse<JobPosting>>) => {
    const result = await this.jobPostingService.createJobPosting(req.body, req.user);
    res.status(201).json(successResponse<JobPosting>(result));
  };

  /**
   * Public candidate facing API
   * @param req
   * @param res
   */
  getPublicJobPostings = async (req: Request, res: Response<ApiSuccessResponse<JobPostingListItem[]>>) => {
    const result = await this.jobPostingService.getPublicJobPostings(req.query);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  };

  /**
   * For recruiters and admins
   * @param req
   * @param res
   */
  getJobPostings = async (req: Request, res: Response<ApiSuccessResponse<JobPostingListItem[]>>) => {
    const result = await this.jobPostingService.getJobPostings(req.query, req.user);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  };

  // TODO: GET /api/job-postings/:id?include=skills,statusHistory,company
  /**
   * Get job posting details, supports dynamic joins
   * @param req
   * @param res
   */
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

  // TODO: Nice to have, not required
  getJobPostingStatusHistory = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService.getJobPostingStatusHistory(req.params.id);

    res.status(200).json(result);
  };

  /**
   * For recruiters and admins:
   * - Update existing draft (title, description, expiresAt, skills)
   * - Send to review (update status to PendingApproval)
   * - Set to paused
   * - Set to closed
   * - Approve or reject pending postings
   * - Validate state transitions !!!
   * @param req
   * @param res
   */
  updateJobPosting = async (req: Request<JobPostingParams>, res: Response<ApiSuccessResponse<JobPosting>>) => {
    const result = await this.jobPostingService.updateJobPosting(req.params.id, req.body, req.user);
    res.status(200).json(successResponse(result));
  };

  // TODO: Review pending job posting (approve or decline) - admin only

  deleteJobPosting = async (req: Request<JobPostingParams>, res: Response) => {
    await this.jobPostingService.deleteJobPosting(req.params.id, req.user);
    res.status(204).send();
  };
}
