import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { jobApplication } from './jobApplication.schema.ts';
import { timestamps } from '../util/utils.ts';
import { sql } from 'drizzle-orm';

export const applicationReview = pgTable(
  'application_review',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    jobApplicationId: integer('job_application_id').references(() => jobApplication.id),
    companyId: integer('company_id').references(() => jobApplication.id),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull(),
    ...timestamps,
  },
  (table) => [check('rating_range', sql`${table.rating} BETWEEN 1 AND 5`)],
);
