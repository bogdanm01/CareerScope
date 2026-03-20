import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/timestamps.ts';

// TODO: Are we missing any columns here?

export const skill = pgTable('skill', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  ...timestamps,
});
