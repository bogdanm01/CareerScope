import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { enumCheckConstraint, timestamps } from '../util/utils.ts';
import { company } from './company.schema.ts';
import { JOB_POSTING_STATUS } from '../util/constants.ts';

export const jobPosting = pgTable(
  'job_posting',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer()
      .references(() => company.id)
      .notNull(),
    title: text(),
    description: text(),
    status: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_POSTING_STATUS)],
);

export type JobPostingStatus = (typeof JOB_POSTING_STATUS)[keyof typeof JOB_POSTING_STATUS];
export type JobPosting = typeof jobPosting.$inferSelect;
export type JobPostingInsert = typeof jobPosting.$inferInsert;
