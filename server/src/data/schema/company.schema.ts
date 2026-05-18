import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { COMPANY_APPROVAL_STATUS } from '../util/constants.ts';

export const company = pgTable('company', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  approvalStatus: text('approval_status').default(COMPANY_APPROVAL_STATUS.PENDING_APPROVAL).notNull(),
  approvalRejectionReason: text('approval_rejection_reason'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  taxId: text('tax_id').notNull().unique(),
  shortDescription: text('short_description'),
  description: text('description'),
  foundingYear: integer('founding_year'),
  numberOfEmployees: integer('number_of_employees'),
  address: text('address').notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
});

export type Company = typeof company.$inferSelect;
export type CompanyInsert = typeof company.$inferInsert;
