import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const company = pgTable('company', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  isApproved: boolean().default(false).notNull(),
  approvedAt: timestamp({ withTimezone: true }),
  taxId: text().notNull(),
  shortDescription: text(),
  description: text(),
  foundingYear: integer(),
  numberOfEmployees: integer(),
  address: text().notNull(),
  logoUrl: text(),
  websiteUrl: text(),
});

export type Company = typeof company.$inferSelect;
export type CompanyInsert = typeof company.$inferInsert;
