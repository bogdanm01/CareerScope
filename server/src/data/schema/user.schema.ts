import { boolean, date, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps.ts';

export const userTable = pgTable('user', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password').notNull(),
  name: varchar('name'),
  profilePicture: varchar('profile_picture'),
  dateOfBirth: date(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  onboardingStep: integer('onboarding_step').default(1).notNull(),
  ...timestamps,
});
