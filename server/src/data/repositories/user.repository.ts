import { GenericRepository } from './generic.repository.ts';
import { user, UserInsert } from '../schema/auth.schema.ts';
import { User } from 'better-auth';
import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { userSkill, UserSkillInsert } from '../schema/user-skill.schema.ts';
import { eq } from 'drizzle-orm';
import { OnboardingStatus } from '../util/constants.ts';

@injectable()
export class UserRepository extends GenericRepository<User, UserInsert, string> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, user);
  }

  // TODO: Move this to a dedicated user-skill.repository.ts when user skill operations grow.
  async replaceUserSkills(
    userId: string,
    skills: UserSkillInsert[],
    onboardingStatus?: OnboardingStatus,
  ) {
    return await this.db.transaction(async (tx) => {
      await tx.delete(userSkill).where(eq(userSkill.userId, userId));

      if (skills.length === 0) {
        return [];
      }

      const newSkills = await tx.insert(userSkill).values(skills).returning();

      if (onboardingStatus) {
        await tx.update(user).set({ onboardingStatus }).where(eq(user.id, userId));
      }

      return newSkills;
    });
  }

  async updateCandidateCv(userId: string, cvUrl: string, onboardingStatus: OnboardingStatus) {
    const [updatedUser] = await this.db
      .update(user)
      .set({ cvUrl, onboardingStatus })
      .where(eq(user.id, userId))
      .returning({ cvUrl: user.cvUrl, onboardingStatus: user.onboardingStatus });

    return updatedUser;
  }
}
