// TODO: poreski broj ili nesto slicno radi verifikacije ???

import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const company = pgTable('company', {
  id: integer(),
  name: text().notNull(),
  shortDescription: text('short_description'),
  description: text('description').notNull(),
  foundingYear: integer('founding_year').notNull(),
  numberOfEmployees: integer('number_of_employees'),
  country: text(''),
  city: text(''),
  logoUrl: text('logo_url'),
  website_url: text('website_url'),
});
