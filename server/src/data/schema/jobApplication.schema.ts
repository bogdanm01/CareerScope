import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import { user } from './user.schema.ts';
import { jobPosting } from './jobPosting.schema.ts';

export const jobApplication = pgTable('job_application', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => user.id),
  jobPostingId: integer('job_posting_id').references(() => jobPosting.id), // what when job posting is deleted/archived
  status: text('status').notNull(),
  ...timestamps,
});

export type JobApplication = typeof jobApplication.$inferSelect;
export type JobApplicationInsert = typeof jobApplication.$inferInsert;
