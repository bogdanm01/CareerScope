import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { InterviewActivityService } from '../services/interview-activity.service.ts';
import { successResponse } from '../lib/api-response.ts';
import { JobApplicationHiringStage } from '../data/schema/job-application-hiring-stage.schema.ts';
import { JobPostingHiringStage } from '../data/schema/job-posting-hiring-stage.schema.ts';

@injectable()
export class InterviewActivityController {
  constructor(@inject(TOKENS.interviewActivityService) private interviewActivityService: InterviewActivityService) {}

  async getPostingActivities(req: Request, res: Response) {
    const result = await this.interviewActivityService.getPostingActivities(req.params.id, req.user);
    res.status(200).json(successResponse<JobPostingHiringStage[]>(result.data));
  }

  async replacePostingActivities(req: Request, res: Response) {
    const result = await this.interviewActivityService.replacePostingActivities(req.params.id, req.body, req.user);
    res.status(200).json(successResponse<JobPostingHiringStage[]>(result.data, 'Interview process updated'));
  }

  async getApplicationActivities(req: Request, res: Response) {
    const result = await this.interviewActivityService.getApplicationActivities(req.params.id, req.user);
    res.status(200).json(successResponse(result.data));
  }

  async createApplicationActivity(req: Request, res: Response) {
    const result = await this.interviewActivityService.createApplicationActivity(req.params.id, req.body, req.user);
    res.status(201).json(successResponse<JobApplicationHiringStage>(result.data, 'Interview activity created'));
  }

  async updateApplicationActivity(req: Request, res: Response) {
    const result = await this.interviewActivityService.updateApplicationActivity(req.params.id, req.body, req.user);
    res.status(200).json(successResponse<JobApplicationHiringStage>(result.data, 'Interview activity updated'));
  }

  async deleteApplicationActivity(req: Request, res: Response) {
    const result = await this.interviewActivityService.deleteApplicationActivity(req.params.id, req.user);
    res.status(200).json(successResponse(result.data, 'Interview activity deleted'));
  }
}
