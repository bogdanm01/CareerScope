import { GenericRepository } from './generic.repository.ts';
import skill, { Skill, SkillInsert } from '../schema/skill.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { skillCategory } from '../schema/skill-category.schema.ts';
import { asc } from 'drizzle-orm';

export type SkillCategoryListItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

@injectable()
export class SkillRepository extends GenericRepository<Skill, SkillInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, skill);
  }

  async findSkillCategories(): Promise<SkillCategoryListItem[]> {
    return this.db
      .select({
        id: skillCategory.id,
        name: skillCategory.name,
        slug: skillCategory.slug,
        description: skillCategory.description,
      })
      .from(skillCategory)
      .orderBy(asc(skillCategory.name));
  }
}
