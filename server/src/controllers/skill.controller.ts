import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SkillService } from '../services/skill.service.ts';
import { successResponse } from '../lib/api-response.ts';

@injectable()
export class SkillController {
  constructor(@inject(TOKENS.skillService) private skillService: SkillService) {}

  async getSkillCategories(_req: Request, res: Response) {
    const result = await this.skillService.getSkillCategories();
    res.status(200).send(successResponse(result.data));
  }

  async getSkills(req: Request, res: Response) {
    const result = await this.skillService.getSkills(req.query);
    res.status(200).send(successResponse(result.data));
  }
}
