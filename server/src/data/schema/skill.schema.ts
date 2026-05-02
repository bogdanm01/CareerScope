import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';

export const skill = pgTable('skill', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  ...timestamps,
});

export type Skill = typeof skill.$inferSelect;
export type SkillInsert = typeof skill.$inferInsert;
