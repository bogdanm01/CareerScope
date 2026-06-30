import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AnalyticsService } from '../services/analytics.service.ts';
import { successResponse } from '../lib/api-response.ts';

@injectable()
export class AnalyticsController {
  constructor(@inject(TOKENS.analyticsService) private analyticsService: AnalyticsService) {}

  async getOverview(req: Request, res: Response) {
    const result = await this.analyticsService.getOverview(req.query, req.user);
    res.status(200).send(successResponse(result.data));
  }
}
