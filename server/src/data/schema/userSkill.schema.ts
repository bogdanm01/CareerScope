import { integer, pgTable } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/timestamps.ts';
import { skill } from './skill.schema.ts';
import { user } from './user.schema.ts';

export const userSkill = pgTable('user_skill', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .references(() => user.id)
    .notNull(),
  skillId: integer()
    .references(() => skill.id)
    .notNull(),
  yearsOfExperience: integer().notNull(),
  ...timestamps,
});
