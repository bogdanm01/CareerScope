import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/timestamps.ts';
import { user } from './user.schema.ts';
import { sql } from 'drizzle-orm';
import { company } from './company.schema.ts';

// TODO: Define job posting statuses as previously agreed upon
export const JOB_POSTING_STATUS = {
  PENDING: 'Pending',
} as const;

export type JobPostingStatus = (typeof JOB_POSTING_STATUS)[keyof typeof JOB_POSTING_STATUS];

const validStatuses = Object.values(JOB_POSTING_STATUS)
  .map((s) => `'${s}'`)
  .join(', ');

// TODO: Add a column for job filtering by category? (frontend, backend, full stack, devops etc.) Would require another table for categories
// TODO: statusSetAt column?
// TODO: deletedAt column for soft delete (or archived at)

export const jobPosting = pgTable(
  'job_posting',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer('company_id')
      .references(() => company.id)
      .notNull(),
    title: integer('user_id').references(() => user.id),
    description: text('description').notNull(),
    status: text('status').notNull(),
    // createdBy
    // deadline
    ...timestamps,
  },
  (table) => [check('age_check1', sql`${table.status} IN ${sql.raw(validStatuses)}`)],
);
