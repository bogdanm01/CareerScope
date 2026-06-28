import { GenericRepository } from './generic.repository.ts';
import skill, { Skill, SkillInsert } from '../schema/skill.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { skillCategory } from '../schema/skill-category.schema.ts';
import { and, asc, eq, ilike, inArray, or, SQL } from 'drizzle-orm';
import { SkillListRequest } from '../../lib/zod/skill.zod-schema.ts';

export type SkillCategoryListItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type SkillListItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  requiresYearsOfExperience: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
  };
};

export type SkillRequirement = {
  id: number;
  requiresYearsOfExperience: boolean;
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

  async findSkills(filters: SkillListRequest = {}): Promise<SkillListItem[]> {
    const { categoryId, search } = filters;
    const conditions: SQL[] = [];

    if (categoryId) {
      conditions.push(eq(skill.categoryId, categoryId));
    }

    if (search) {
      conditions.push(or(ilike(skill.name, `%${search}%`), ilike(skill.description, `%${search}%`)) as SQL);
    }

    const query = this.db
      .select({
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        requiresYearsOfExperience: skill.requiresYearsOfExperience,
        category: {
          id: skillCategory.id,
          name: skillCategory.name,
          slug: skillCategory.slug,
        },
      })
      .from(skill)
      .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
      .$dynamic();

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    return query.orderBy(asc(skill.name));
  }

  async findSkillRequirements(skillIds: number[]): Promise<SkillRequirement[]> {
    if (skillIds.length === 0) {
      return [];
    }

    return this.db
      .select({
        id: skill.id,
        requiresYearsOfExperience: skill.requiresYearsOfExperience,
      })
      .from(skill)
      .where(inArray(skill.id, skillIds));
  }
}
