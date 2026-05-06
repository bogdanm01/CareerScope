import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';

export const skillCategory = pgTable('skill_category', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  ...timestamps,
});

export type SkillCategory = typeof skillCategory.$inferSelect;
export type SkillCategoryInsert = typeof skillCategory.$inferInsert;
