import { integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import skill from './skill.schema.ts';
import { user } from './auth.schema.ts';

export const userSkill = pgTable(
  'user_skill',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .references(() => user.id)
      .notNull(),
    skillId: integer('skill_id')
      .references(() => skill.id)
      .notNull(),
    yearsOfExperience: integer('years_of_experience').notNull(),
    ...timestamps,
  },
  (table) => [unique('user_id_skill_id_unq').on(table.userId, table.skillId)],
);

export type UserSkill = typeof userSkill.$inferSelect;
export type UserSkillInsert = typeof userSkill.$inferInsert;
