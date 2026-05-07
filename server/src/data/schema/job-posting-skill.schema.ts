import { integer, pgTable } from 'drizzle-orm/pg-core';
import { jobPosting } from './job-posting.schema.ts';
import skill from './skill.schema.ts';

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
