/**
 * import { integer, pgTable, text } from 'drizzle-orm/pg-core';
 * import { timestamps } from '../util/utils.ts';
 * import { skill } from './skill.schema.ts';
 * import { user } from './auth.schema.ts';
 *
 * export const userSkill = pgTable('user_skill', {
 *   id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
 *   userId: text('user_id')
 *     .references(() => user.id)
 *     .notNull(),
 *   skillId: integer('skill_id')
 *     .references(() => skill.id)
 *     .notNull(),
 *   yearsOfExperience: integer('years_of_experience').notNull(),
 *   ...timestamps,
 * });
 *
 * export type UserSkill = typeof userSkill.$inferSelect;
 * export type UserSkillInsert = typeof userSkill.$inferInsert;
 */

import { integer, pgTable } from 'drizzle-orm/pg-core';
import { jobPosting } from './job-posting.schema.ts';
import { skill } from './skill.schema.ts';

export const jobPostingSkill = pgTable('job_posting_skill', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  jobPostingId: integer('job_posting_id')
    .references(() => jobPosting.id)
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skill.id)
    .notNull(),
  yoe: integer('yoe'),
});
