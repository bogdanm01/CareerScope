import { injectable } from 'tsyringe';
import { JobPostingService } from '../services/job-posting-service.ts';
import { Request, Response } from 'express';

type JobPostingParams = {
  id: string;
};

@injectable()
export class JobPostingController {
  constructor(private jobPostingService: JobPostingService) {}

  getAll = async (req: Request, res: Response) => {
    const result = await this.jobPostingService?.getAll(req.query);

    res.status(200).json(result);
  };

  getById = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService?.getById(req.params.id);

    res.status(200).json(result);
  };

  getStatusHistory = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService?.getStatusHistory(req.params.id);

    res.status(200).json(result);
  };

  create = async (req: Request, res: Response) => {
    const result = await this.jobPostingService?.create(req.body, req.user);

    res.status(201).json(result);
  };

  update = async (req: Request<JobPostingParams>, res: Response) => {
    const result = await this.jobPostingService?.update(req.params.id, req.body, req.user);

    res.status(200).json(result);
  };

  delete = async (req: Request<JobPostingParams>, res: Response) => {
    await this.jobPostingService?.delete(req.params.id, req.user);

    res.status(204).send();
  };
}
