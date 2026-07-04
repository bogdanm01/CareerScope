import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { company } from './company.schema.ts';
import { user } from './auth.schema.ts';
import { COMPANY_APPROVAL_STATUS } from '../util/constants.ts';
import { enumCheckConstraint } from '../util/utils.ts';

export const companyChangeRequest = pgTable(
  'company_change_request',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer('company_id')
      .references(() => company.id)
      .notNull(),
    createdByUserId: text('created_by_user_id')
      .references(() => user.id)
      .notNull(),
    status: text('status').default(COMPANY_APPROVAL_STATUS.PENDING_APPROVAL).notNull(),
    rejectionReason: text('rejection_reason'),
    name: text('name').notNull(),
    taxId: text('tax_id').notNull(),
    shortDescription: text('short_description'),
    description: text('description'),
    foundingYear: integer('founding_year'),
    numberOfEmployees: integer('number_of_employees'),
    address: text('address').notNull(),
    logoUrl: text('logo_url'),
    websiteUrl: text('website_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [enumCheckConstraint('status_check', table.status, COMPANY_APPROVAL_STATUS)],
);

export type CompanyChangeRequest = typeof companyChangeRequest.$inferSelect;
export type CompanyChangeRequestInsert = typeof companyChangeRequest.$inferInsert;
