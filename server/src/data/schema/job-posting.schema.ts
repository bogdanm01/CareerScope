import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { enumCheckConstraint, timestamps } from '../util/utils.ts';
import { company } from './company.schema.ts';
import { JOB_POSTING_STATUS } from '../util/constants.ts';
import { user } from './auth.schema.ts';

export const jobPosting = pgTable(
  'job_posting',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer('company_id')
      .references(() => company.id)
      .notNull(),
    title: text('title'),
    description: text('description'),
    status: text('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdBy: text('created_by')
      .references(() => user.id)
      .notNull(),
    ...timestamps,
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_POSTING_STATUS)],
);

export type JobPostingStatus = (typeof JOB_POSTING_STATUS)[keyof typeof JOB_POSTING_STATUS];
export type JobPosting = typeof jobPosting.$inferSelect;
export type JobPostingInsert = typeof jobPosting.$inferInsert;
