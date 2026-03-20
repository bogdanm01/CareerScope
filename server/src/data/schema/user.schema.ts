import { boolean, date, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import { company } from './company.schema.ts';

export const USER_ROLE = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  CANDIDATE: 'Candidate',
} as const;

export const user = pgTable('user', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  profilePictureUrl: text(),
  dateOfBirth: date(),
  isDeleted: boolean().default(false).notNull(),
  onboardingStep: integer().default(1).notNull(),
  role: text().notNull(),
  companyId: integer().references(() => company.id),
  ...timestamps,
});

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type User = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;
