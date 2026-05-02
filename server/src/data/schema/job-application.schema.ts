import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import { jobPosting } from './job-posting.schema.ts';

import { user } from './auth.schema.ts';

export const jobApplication = pgTable('job_application', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').references(() => user.id),
  jobPostingId: integer('job_posting_id').references(() => jobPosting.id),
  status: text('status').notNull(),
  ...timestamps,
});

export type JobApplication = typeof jobApplication.$inferSelect;
export type JobApplicationInsert = typeof jobApplication.$inferInsert;
