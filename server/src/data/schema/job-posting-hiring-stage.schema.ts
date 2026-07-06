import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { jobPosting } from './job-posting.schema.ts';
import { timestamps } from '../util/utils.ts';

export const jobPostingHiringStage = pgTable('job_posting_hiring_stage', {
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

export type JobPostingHiringStage = typeof jobPostingHiringStage.$inferSelect;
export type JobPostingHiringStageInsert = typeof jobPostingHiringStage.$inferInsert;
