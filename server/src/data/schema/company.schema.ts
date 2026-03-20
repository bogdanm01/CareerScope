import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const company = pgTable('company', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  taxId: text('tax_id').notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  foundingYear: integer('founding_year'),
  numberOfEmployees: integer('number_of_employees'),
  address: text('address').notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
});

export type Company = typeof company.$inferSelect;
export type CompanyInsert = typeof company.$inferInsert;
