import { GenericRepository } from './generic.repository.ts';
import { user, UserInsert } from '../schema/auth.schema.ts';
import { User } from 'better-auth';
import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { userSkill, UserSkillInsert } from '../schema/user-skill.schema.ts';
import { and, asc, count, desc, eq, ilike, ne, or, SQL } from 'drizzle-orm';
import { OnboardingStatus, UserRole } from '../util/constants.ts';
import skill from '../schema/skill.schema.ts';
import { company } from '../schema/company.schema.ts';
import type { AdminUserListRequest, AdminUserUpdate } from '../../lib/zod/admin-user.zod-schema.ts';

export type AdminUserListItem = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  dateOfBirth: string;
  onboardingStatus: string;
  isDeleted: boolean;
  company: { id: number; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

type AdminUserRow = Omit<AdminUserListItem, 'company'> & { companyId: number | null; companyName: string | null };

type RecruiterOnboardingUpdate = {
  role: UserRole;
  companyId: number;
  onboardingStatus: OnboardingStatus;
};

type ProfileUpdate = {
  firstName: string;
  lastName: string;
  name: string;
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
    requiresYearsOfExperience: boolean;
    yearsOfExperience: number | null;
  }[];
};

@injectable()
export class UserRepository extends GenericRepository<User, UserInsert, string> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, user);
  }

  private getAdminUserSelectFields() {
    return {
      id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName,
      email: user.email, emailVerified: user.emailVerified, image: user.image, role: user.role,
      dateOfBirth: user.dateOfBirth, onboardingStatus: user.onboardingStatus, isDeleted: user.isDeleted,
      companyId: company.id, companyName: company.name, createdAt: user.createdAt, updatedAt: user.updatedAt,
    };
  }

  private mapAdminUser(record: AdminUserRow): AdminUserListItem {
    const { companyId, companyName, ...userRecord } = record;
    return {
      ...userRecord,
      company: companyId && companyName ? { id: companyId, name: companyName } : null,
    };
  }

  async findAdminUsers(filters: AdminUserListRequest): Promise<{ data: AdminUserListItem[]; totalItems: number }> {
    const conditions: SQL[] = [];
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(or(ilike(user.name, pattern), ilike(user.email, pattern), ilike(user.firstName, pattern), ilike(user.lastName, pattern)) as SQL);
    }
    if (filters.role) conditions.push(eq(user.role, filters.role));
    if (typeof filters.isDeleted === 'boolean') conditions.push(eq(user.isDeleted, filters.isDeleted));

    const where = conditions.length ? and(...conditions) : undefined;
    const direction = filters.sort === 'asc' ? asc : desc;
    const rows = await this.db.select(this.getAdminUserSelectFields()).from(user).leftJoin(company, eq(user.companyId, company.id))
      .where(where).orderBy(direction(user[filters.orderBy])).limit(filters.limit).offset((filters.page - 1) * filters.limit);
    const [total] = await this.db.select({ value: count() }).from(user).where(where);
    return { data: rows.map((row) => this.mapAdminUser(row)), totalItems: total?.value ?? 0 };
  }

  async findAdminUserById(id: string): Promise<AdminUserListItem | null> {
    const [record] = await this.db.select(this.getAdminUserSelectFields()).from(user)
      .leftJoin(company, eq(user.companyId, company.id)).where(eq(user.id, id)).limit(1);
    return record ? this.mapAdminUser(record) : null;
  }

  async findOtherByEmail(email: string, excludedId: string) {
    const [record] = await this.db.select({ id: user.id }).from(user)
      .where(and(eq(user.email, email.toLowerCase()), ne(user.id, excludedId))).limit(1);
    return record ?? null;
  }

  async updateAdminUser(id: string, values: AdminUserUpdate) {
    const [record] = await this.db.update(user).set({ ...values, name: `${values.firstName} ${values.lastName}` })
      .where(eq(user.id, id)).returning({ id: user.id });
    return record ?? null;
  }

  async updateAdminUserStatus(id: string, isDeleted: boolean) {
    const [record] = await this.db.update(user).set({ isDeleted }).where(eq(user.id, id)).returning({ id: user.id });
    return record ?? null;
  }

  async findAccountStatus(id: string) {
    const [record] = await this.db.select({ isDeleted: user.isDeleted }).from(user).where(eq(user.id, id)).limit(1);
    return record ?? null;
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

  async updateProfile(userId: string, values: ProfileUpdate) {
    const [updatedUser] = await this.db
      .update(user)
      .set(values)
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      });

    return updatedUser;
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    const [updatedUser] = await this.db
      .update(user)
      .set({ image: imageUrl })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      });

    return updatedUser;
  }

  async findImageUrl(userId: string) {
    const [record] = await this.db.select({ image: user.image }).from(user).where(eq(user.id, userId)).limit(1);
    return record?.image;
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
        skillRequiresYearsOfExperience: skill.requiresYearsOfExperience,
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
        record.skillRequiresYearsOfExperience === null
      ) {
        return [];
      }

      return [
        {
          id: record.skillId,
          name: record.skillName,
          slug: record.skillSlug,
          description: record.skillDescription,
          requiresYearsOfExperience: record.skillRequiresYearsOfExperience,
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
