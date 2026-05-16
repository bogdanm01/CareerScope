import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { MeService } from '../services/me.service.ts';
import { successResponse } from '../lib/api-response.ts';

@injectable()
export class MeController {
  constructor(@inject(TOKENS.meService) private meService: MeService) {}

  /**
   *
   * @param req
   * @param res
   */
  async replaceCandidateSkills(req: Request, res: Response) {
    const result = await this.meService.replaceCandidateSkills(req.body, req.user);
    res.status(200).send(successResponse(result.data));
  }

  /**
   *
   * @param req
   * @param res
   */
  async uploadCandidateCv(req: Request, res: Response) {
    const result = await this.meService.uploadCandidateCv(req.file, req.user);
    res.status(200).send(successResponse(result.data));
  }
}
