import { injectable } from 'tsyringe';
import { JobPostingService } from '../services/job-posting-service.ts';
import { Request, Response } from 'express';

type JobPostingParams = {
  id: string;
};

@injectable()
export class JobPostingController {
  constructor(private jobPostingService: JobPostingService) {}

  getAllJobPostings = async (req: Request, res: Response) => {
    const result = await this.jobPostingService.getAllJobPostings(req.query);

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

  createJobPosting = async (req: Request, res: Response) => {
    const result = await this.jobPostingService.createJobPosting(req.body, req.user);

    res.status(201).json(result);
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
