import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SkillCategoryListItem, SkillRepository } from '../data/repositories/skill.repository.ts';
import { SingleResult } from '../lib/api-response.ts';

@injectable()
export class SkillService {
  constructor(@inject(TOKENS.skillRepository) private skillRepository: SkillRepository) {}

  async getSkillCategories(): Promise<SingleResult<SkillCategoryListItem[]>> {
    const categories = await this.skillRepository.findSkillCategories();

    return {
      data: categories,
    };
  }

  async getSkills() {}
}
