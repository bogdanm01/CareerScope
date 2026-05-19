import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

@injectable()
export class SkillController {
  async getSkillCategories(_req: Request, _res: Response) {}

  async getSkills(_req: Request, _res: Response) {}
}
