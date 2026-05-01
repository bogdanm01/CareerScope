import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { jobPosting } from './job-posting.schema.ts';
import { enumCheckConstraint } from '../utils/utils.ts';
import { JOB_POSTING_STATUS } from '../utils/constants.ts';

export const jobPostingStatusHistory = pgTable(
  'job_posting_status_history',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    jobPostingId: integer()
      .references(() => jobPosting.id)
      .notNull(),
    status: text().notNull(),
    reason: text(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_POSTING_STATUS)],
);

export type JobPostingStatusHistory = typeof jobPostingStatusHistory.$inferSelect;
export type JobPostingStatusHistoryInsert = typeof jobPostingStatusHistory.$inferInsert;
