import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { jobApplication } from './jobApplication.schema.ts';
import { timestamps } from '../util/utils.ts';
import { sql } from 'drizzle-orm';

export const applicationReview = pgTable(
  'application_review',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    jobApplicationId: integer().references(() => jobApplication.id),
    companyId: integer().references(() => jobApplication.id),
    rating: integer().notNull(),
    comment: text().notNull(),
    ...timestamps,
  },
  (table) => [check('rating_range_check', sql`${table.rating} BETWEEN 1 AND 5`)],
);

export type ApplicationReview = typeof applicationReview.$inferSelect;
export type ApplicationReviewInsert = typeof applicationReview.$inferInsert;
