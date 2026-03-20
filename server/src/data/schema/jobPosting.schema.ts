import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { enumCheckConstraint, timestamps } from '../util/utils.ts';
import { company } from './company.schema.ts';

export const JOB_POSTING_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'PendingApproval',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CLOSED: 'Closed',
  EXPIRED: 'Expired',
} as const;

export const jobPosting = pgTable(
  'job_posting',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer('company_id')
      .references(() => company.id)
      .notNull(),
    title: text('title'),
    description: text('description'),
    status: text('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_POSTING_STATUS)],
);

export type JobPostingStatus = (typeof JOB_POSTING_STATUS)[keyof typeof JOB_POSTING_STATUS];
export type JobPosting = typeof jobPosting.$inferSelect;
export type JobPostingInsert = typeof jobPosting.$inferInsert;
