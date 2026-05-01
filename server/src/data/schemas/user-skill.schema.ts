import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../utils/utils.ts';
import { skill } from './skill.schema.ts';
import { user } from './auth.schema.ts';

export const userSkill = pgTable('user_skill', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text()
    .references(() => user.id)
    .notNull(),
  skillId: integer()
    .references(() => skill.id)
    .notNull(),
  yearsOfExperience: integer().notNull(),
  ...timestamps,
});

export type UserSkill = typeof userSkill.$inferSelect;
export type UserSkillInsert = typeof userSkill.$inferInsert;
