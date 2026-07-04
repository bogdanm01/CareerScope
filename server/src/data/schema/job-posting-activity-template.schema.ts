import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { jobPosting } from './job-posting.schema.ts';
import { timestamps } from '../util/utils.ts';

export const jobPostingActivityTemplate = pgTable('job_posting_activity_template', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  jobPostingId: integer('job_posting_id')
    .references(() => jobPosting.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  ...timestamps,
});

export type JobPostingActivityTemplate = typeof jobPostingActivityTemplate.$inferSelect;
export type JobPostingActivityTemplateInsert = typeof jobPostingActivityTemplate.$inferInsert;
