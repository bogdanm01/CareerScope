import { TOKENS } from '../config/dependency-tokens.ts';
import { inject, injectable } from 'tsyringe';
import { JobApplicationService } from '../services/job-application.service.ts';
import { Request, Response } from 'express';
import { successResponse } from '../lib/api-response.ts';
import { JobApplication } from '../data/schema/job-application.schema.ts';
import {
  CandidateJobApplicationListItem,
  JobApplicationDetail,
} from '../data/repositories/job-application.repository.ts';

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
  async createJobApplication(req: Request, res: Response) {
    const result = await this.jobApplicationService.createJobApplication(req.params.id, req.body, req.user);
    res.status(201).send(successResponse<JobApplication>(result, 'Job application created'));
  }

  /**
   * Returns job applications for one job posting.
   *
   * Admins can retrieve applications for any posting, while recruiters are
   * scoped to postings owned by their company. The service validates the job
   * posting id, query pagination, and access rules.
   *
   * @param req Express request containing the job posting id, query parameters, and authenticated user.
   * @param res Express response returning paginated job applications with applicant details.
   */
  async getJobApplications(req: Request, res: Response) {
    const result = await this.jobApplicationService.getJobApplications(req.params.id, req.query, req.user);
    res.status(200).json(successResponse(result.data, undefined, result.pagination));
  }

  /**
   * Returns one job application with candidate and job posting context.
   *
   * The service validates the application id and applies recruiter company
   * scoping before returning applicant details, candidate skills, compact job
   * posting data, and required job posting skills.
   *
   * @param req Express request containing the job application id and authenticated user.
   * @param res Express response returning the job application detail.
   */
  async getJobApplication(req: Request, res: Response) {
    const result = await this.jobApplicationService.getJobApplicationById(req.params.id, req.user);
    res.status(200).json(successResponse<JobApplicationDetail>(result.data));
  }

  async updateJobApplication(req: Request, res: Response) {
    const result = await this.jobApplicationService.updateJobApplication(req.params.id, req.body, req.user);
    res.status(200).json(successResponse<JobApplication>(result.data, 'Job application updated'));
  }

  async createApplicationReview(req: Request, res: Response) {
    await this.jobApplicationService.createApplicationReview(req.params.id, req.body, req.user);
    res.status(204).send();
  }

  /**
   * Returns job applications for the authenticated candidate.
   *
   * The service validates pagination and scopes results to the authenticated
   * candidate. Each result includes compact job posting and company context.
   *
   * @param req Express request containing query parameters and authenticated candidate.
   * @param res Express response returning paginated candidate job applications.
   */
  async getMyJobApplications(req: Request, res: Response) {
    const result = await this.jobApplicationService.getMyJobApplications(req.query, req.user);
    res.status(200).json(successResponse<CandidateJobApplicationListItem[]>(result.data, undefined, result.pagination));
  }

  /**
   * Returns one job application for the authenticated candidate.
   *
   * The service validates the application id and ensures the application
   * belongs to the authenticated candidate before returning the detail DTO.
   *
   * @param req Express request containing the job application id and authenticated candidate.
   * @param res Express response returning the candidate job application detail.
   */
  async getMyJobApplication(req: Request, res: Response) {
    const result = await this.jobApplicationService.getMyJobApplicationById(req.params.id, req.user);
    res.status(200).json(successResponse<JobApplicationDetail>(result.data));
  }
}
