import { GenericRepository } from './generic.repository.ts';
import { user, UserInsert } from '../schema/auth.schema.ts';
import { User } from 'better-auth';
import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { userSkill, UserSkillInsert } from '../schema/user-skill.schema.ts';
import { eq } from 'drizzle-orm';

@injectable()
export class UserRepository extends GenericRepository<User, UserInsert, string> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, user);
  }

  // TODO: Move this to a dedicated user-skill.repository.ts when user skill operations grow.
  async replaceUserSkills(userId: string, skills: UserSkillInsert[]) {
    return await this.db.transaction(async (tx) => {
      await tx.delete(userSkill).where(eq(userSkill.userId, userId));

      if (skills.length === 0) {
        return [];
      }

      return tx.insert(userSkill).values(skills).returning();
    });
  }
}
