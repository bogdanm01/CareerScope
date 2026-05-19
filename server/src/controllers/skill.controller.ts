import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SkillService } from '../services/skill.service.ts';

@injectable()
export class SkillController {
  constructor(@inject(TOKENS.skillService) private skillService: SkillService) {}

  async getSkillCategories(_req: Request, _res: Response) {
    await this.skillService.getSkillCategories();
  }

  async getSkills(_req: Request, _res: Response) {
    await this.skillService.getSkills();
  }
}
