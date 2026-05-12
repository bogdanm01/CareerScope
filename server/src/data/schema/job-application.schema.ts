import { boolean, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { enumCheckConstraint, timestamps } from '../util/utils.ts';
import { jobPosting } from './job-posting.schema.ts';

import { user } from './auth.schema.ts';
import { JOB_APPLICATION_STATUS } from '../util/constants.ts';

export const jobApplication = pgTable(
  'job_application',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .references(() => user.id)
      .notNull(),
    jobPostingId: integer('job_posting_id')
      .references(() => jobPosting.id)
      .notNull(),
    status: text('status').notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    unique('user_id_job_posting_id_unq').on(table.userId, table.jobPostingId),
    enumCheckConstraint('status_check', table.status, JOB_APPLICATION_STATUS),
  ],
);

export type JobApplication = typeof jobApplication.$inferSelect;
export type JobApplicationInsert = typeof jobApplication.$inferInsert;
