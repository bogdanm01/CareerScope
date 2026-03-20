import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { JOB_POSTING_STATUS, jobPosting } from './jobPosting.schema.ts';
import { enumCheckConstraint } from '../util/utils.ts';

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
