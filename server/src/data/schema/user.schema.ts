import { boolean, date, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/timestamps.ts';

/* //TODO: Digital cv?
    centralized (TECH) skill repository (managed by admins) for digital cv
    user <-> skill table: {id, userId, skillId, years of experience} 
*/

export const USER_ROLE = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  CANDIDATE: 'Candidate',
} as const;

export const user = pgTable('user', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  profilePictureUrl: text('profile_picture_url'),
  dateOfBirth: date('date_of_birth'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  onboardingStep: integer('onboarding_step').default(1).notNull(),
  role: text('role').notNull(),
  // companyId (for recruiter/hr role)
  // resumeUrl (unrelated to digital cv) ?
  ...timestamps,
});
