import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { jobPosting } from './job-posting.schema.ts';
import { enumCheckConstraint } from '../util/utils.ts';
import { JOB_POSTING_STATUS } from '../util/constants.ts';

export const jobPostingStatusHistory = pgTable(
  'job_posting_status_history',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    jobPostingId: integer('job_posting_id')
      .references(() => jobPosting.id)
      .notNull(),
    status: text('status').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_POSTING_STATUS)],
);

export type JobPostingStatusHistory = typeof jobPostingStatusHistory.$inferSelect;
export type JobPostingStatusHistoryInsert = typeof jobPostingStatusHistory.$inferInsert;
