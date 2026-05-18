import { GenericRepository } from './generic.repository.ts';
import skill, { Skill, SkillInsert } from '../schema/skill.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';

@injectable()
export class SkillRepository extends GenericRepository<Skill, SkillInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, skill);
  }
}
