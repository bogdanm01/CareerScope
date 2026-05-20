import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SkillCategoryListItem, SkillListItem, SkillRepository } from '../data/repositories/skill.repository.ts';
import { SingleResult } from '../lib/api-response.ts';
import { SkillListRequestSchema } from '../lib/zod/skill.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';

@injectable()
export class SkillService {
  constructor(@inject(TOKENS.skillRepository) private skillRepository: SkillRepository) {}

  async getSkillCategories(): Promise<SingleResult<SkillCategoryListItem[]>> {
    const categories = await this.skillRepository.findSkillCategories();

    return {
      data: categories,
    };
  }

  async getSkills(payload: unknown): Promise<SingleResult<SkillListItem[]>> {
    const validationResult = SkillListRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const skills = await this.skillRepository.findSkills(validationResult.data);

    return {
      data: skills,
    };
  }
}
