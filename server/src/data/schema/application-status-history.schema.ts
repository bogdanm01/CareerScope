import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { jobApplication } from './job-application.schema.ts';
import { enumCheckConstraint } from '../util/utils.ts';
import { JOB_APPLICATION_STATUS } from '../util/constants.ts';

export const applicationStatusHistory = pgTable(
  'application_status_history',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    jobApplicationId: integer('job_application_id')
      .references(() => jobApplication.id)
      .notNull(),
    status: text('status').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_APPLICATION_STATUS)],
);

export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
export type ApplicationStatusHistoryInsert = typeof applicationStatusHistory.$inferInsert;
