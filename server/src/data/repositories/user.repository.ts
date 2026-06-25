import { GenericRepository } from './generic.repository.ts';
import { user, UserInsert } from '../schema/auth.schema.ts';
import { User } from 'better-auth';
import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { userSkill, UserSkillInsert } from '../schema/user-skill.schema.ts';
import { eq } from 'drizzle-orm';
import { OnboardingStatus, UserRole } from '../util/constants.ts';
import skill from '../schema/skill.schema.ts';
import { company } from '../schema/company.schema.ts';

type RecruiterOnboardingUpdate = {
  role: UserRole;
  companyId: number;
  onboardingStatus: OnboardingStatus;
};

export type MeUserDetails = {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  image: string | null;
  cvUrl: string | null;
  role: string;
  dateOfBirth: string;
  onboardingStatus: string;
  company: {
    id: number;
    name: string;
    logoUrl: string | null;
  } | null;
  skills: {
    id: number;
    name: string;
    slug: string;
    description: string;
    yearsOfExperience: number;
  }[];
};

@injectable()
export class UserRepository extends GenericRepository<User, UserInsert, string> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, user);
  }

  // TODO: Move this to a dedicated user-skill.repository.ts when user skill operations grow.
  async replaceUserSkills(userId: string, skills: UserSkillInsert[], onboardingStatus?: OnboardingStatus) {
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

  async updateRecruiterOnboarding(userId: string, values: RecruiterOnboardingUpdate) {
    const [updatedUser] = await this.db.update(user).set(values).where(eq(user.id, userId)).returning({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      onboardingStatus: user.onboardingStatus,
    });

    return updatedUser;
  }

  async findByEmail(email: string) {
    const [record] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);

    return record ?? null;
  }

  async findCvUrl(userId: string) {
    const [record] = await this.db.select({ cvUrl: user.cvUrl }).from(user).where(eq(user.id, userId)).limit(1);
    return record?.cvUrl;
  }

  async findOnboardingStatus(userId: string) {
    const [record] = await this.db
      .select({ onboardingStatus: user.onboardingStatus })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return record?.onboardingStatus;
  }

  async findMeById(userId: string): Promise<MeUserDetails | null> {
    const records = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        image: user.image,
        cvUrl: user.cvUrl,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        onboardingStatus: user.onboardingStatus,
        companyId: company.id,
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        skillId: skill.id,
        skillName: skill.name,
        skillSlug: skill.slug,
        skillDescription: skill.description,
        yearsOfExperience: userSkill.yearsOfExperience,
      })
      .from(user)
      .leftJoin(company, eq(user.companyId, company.id))
      .leftJoin(userSkill, eq(user.id, userSkill.userId))
      .leftJoin(skill, eq(userSkill.skillId, skill.id))
      .where(eq(user.id, userId));

    const [firstRecord] = records;

    if (!firstRecord) {
      return null;
    }

    const companyDetails =
      firstRecord.companyId && firstRecord.companyName
        ? {
            id: firstRecord.companyId,
            name: firstRecord.companyName,
            logoUrl: firstRecord.companyLogoUrl,
          }
        : null;

    const skills = records.flatMap((record) => {
      if (
        !record.skillId ||
        !record.skillName ||
        !record.skillSlug ||
        !record.skillDescription ||
        record.yearsOfExperience === null
      ) {
        return [];
      }

      return [
        {
          id: record.skillId,
          name: record.skillName,
          slug: record.skillSlug,
          description: record.skillDescription,
          yearsOfExperience: record.yearsOfExperience,
        },
      ];
    });

    return {
      id: firstRecord.id,
      name: firstRecord.name,
      email: firstRecord.email,
      firstName: firstRecord.firstName,
      lastName: firstRecord.lastName,
      emailVerified: firstRecord.emailVerified,
      image: firstRecord.image,
      cvUrl: firstRecord.cvUrl,
      role: firstRecord.role,
      dateOfBirth: firstRecord.dateOfBirth,
      onboardingStatus: firstRecord.onboardingStatus,
      company: companyDetails,
      skills,
    };
  }
}
