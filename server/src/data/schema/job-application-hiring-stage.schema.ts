import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { jobApplication } from './job-application.schema.ts';
import { jobPostingHiringStage } from './job-posting-hiring-stage.schema.ts';
import { enumCheckConstraint, timestamps } from '../util/utils.ts';
import { JOB_APPLICATION_ACTIVITY_STATUS } from '../util/constants.ts';

export const jobApplicationHiringStage = pgTable(
  'job_application_hiring_stage',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    jobApplicationId: integer('job_application_id')
      .references(() => jobApplication.id)
      .notNull(),
    jobPostingHiringStageId: integer('job_posting_hiring_stage_id').references(() => jobPostingHiringStage.id),
    title: text('title').notNull(),
    description: text('description'),
    orderIndex: integer('order_index').notNull(),
    status: text('status').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    internalNote: text('internal_note'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    ...timestamps,
  },
  (table) => [enumCheckConstraint('status_check', table.status, JOB_APPLICATION_ACTIVITY_STATUS)],
);

export type JobApplicationHiringStage = typeof jobApplicationHiringStage.$inferSelect;
export type JobApplicationHiringStageInsert = typeof jobApplicationHiringStage.$inferInsert;
