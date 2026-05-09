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
   * Creates a job posting for the authenticated recruiter.
   *
   * The service validates the request body, assigns the posting to the
   * recruiter's company, creates initial status history, and persists skills
   * when provided.
   *
   * @param req Express request containing the create payload and authenticated user.
   * @param res Express response returning the created job posting.
   */
  createJobPosting = async (req: Request, res: Response<ApiSuccessResponse<JobPosting>>) => {
    const result = await this.jobPostingService.createJobPosting(req.body, req.user);
    res.status(201).json(successResponse<JobPosting>(result));
  };

  /**
   * Returns public active job postings.
   *
   * This endpoint is candidate/public-facing and supports query filters such
   * as pagination, sorting, company filtering, and skill filtering.
   *
   * @param req Express request containing public list query parameters.
   * @param res Express response returning paginated active job postings.
   */
  getPublicJobPostings = async (req: Request, res: Response<ApiSuccessResponse<JobPostingListItem[]>>) => {
    const result = await this.jobPostingService.getPublicJobPostings(req.query);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  };

  /**
   * Returns job postings for recruiter/admin dashboards.
   *
   * Admins can query across companies, while recruiters are scoped to their
   * own company by the service layer.
   *
   * @param req Express request containing authenticated list query parameters.
   * @param res Express response returning paginated job postings.
   */
  getJobPostings = async (req: Request, res: Response<ApiSuccessResponse<JobPostingListItem[]>>) => {
    const result = await this.jobPostingService.getJobPostings(req.query, req.user);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  };

  /**
   * Returns one job posting by id.
   *
   * Supports optional detail includes through the `include` query parameter,
   * such as `skills`, `statusHistory`, and `company`.
   *
   * @param req Express request containing the posting id and optional includes.
   * @param res Express response returning the job posting detail.
   */
  getJobPostingById = async (
    req: Request<{ id: string }, undefined, undefined, { include?: string }>,
    res: Response<ApiSuccessResponse<JobPostingDetail>>,
  ) => {
    const result = await this.jobPostingService.getJobPostingById(
      {
        id: req.params.id,
        include: req.query.include ?? undefined,
      },
      req.user,
    );

    res.status(200).json(successResponse(result.data));
  };

  /**
   * Returns status history for one job posting.
   *
   * This is currently a lightweight placeholder for a future audit trail API.
   *
   * @param req Express request containing the posting id.
   * @param res Express response returning status history data.
   */
  getJobPostingStatusHistory = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService.getJobPostingStatusHistory(req.params.id);
    res.status(200).json(result);
  };

  /**
   * Updates one job posting.
   *
   * Recruiters can edit allowed posting fields and request recruiter-owned
   * status transitions. Admins can approve, reject, or close postings through
   * admin-specific update rules.
   *
   * @param req Express request containing the posting id, update payload, and authenticated user.
   * @param res Express response returning the updated job posting.
   */
  updateJobPosting = async (req: Request<JobPostingParams>, res: Response<ApiSuccessResponse<JobPosting>>) => {
    const result = await this.jobPostingService.updateJobPosting(req.params.id, req.body, req.user);
    res.status(200).json(successResponse(result));
  };

  /**
   * Deletes one job posting.
   *
   * Intended to become a soft-delete/close style operation once delete
   * business rules are implemented in the service layer.
   *
   * @param req Express request containing the posting id and authenticated user.
   * @param res Express response with no content on success.
   */
  deleteJobPosting = async (req: Request<JobPostingParams>, res: Response) => {
    await this.jobPostingService.deleteJobPosting(req.params.id, req.user);
    res.status(204).send();
  };
}
