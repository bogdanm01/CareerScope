import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { JobPostingService } from '../services/job-posting.service.ts';
import { successResponse } from '../lib/api-response.ts';
import { CompanyService } from '../services/company.service.ts';

@injectable()
export class CompanyController {
  constructor(
    @inject(TOKENS.jobPostingService) private jobPostingService: JobPostingService,
    @inject(TOKENS.companyService) private companyService: CompanyService,
  ) {}

  /**
   * Returns public job postings for one company.
   *
   * The service validates the company id and query parameters, then returns
   * only active, non-deleted, non-expired postings for the selected company.
   *
   * @param req Express request containing the company id and public list query parameters.
   * @param res Express response returning paginated public job postings for the company.
   */
  async getPublicJobPostings(req: Request, res: Response) {
    const payload = {
      ...req.query,
      companyId: req.params.id,
    };

    const result = await this.jobPostingService.getPublicJobPostings(payload, { includeCompany: false });
    res.status(200).send(successResponse(result.data, undefined, result.pagination));
  }

  /**
   * Returns public company profile details.
   *
   * The service validates the company id and returns only approved,
   * non-deleted companies. Sensitive/internal fields are omitted from the
   * public response.
   *
   * @param req Express request containing the company id.
   * @param res Express response returning public company profile details.
   */
  async getCompany(req: Request, res: Response) {
    const result = await this.companyService.getCompany(req.params.id);
    res.status(200).send(successResponse(result.data));
  }
}
