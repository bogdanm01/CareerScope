import { customType, index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import { skillCategory } from './skill-category.schema.ts';
import { sql } from 'drizzle-orm';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

const skill = pgTable(
  'skill',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

    name: text('name').notNull(),
    description: text('description').notNull(),
    slug: text('slug').notNull().unique(),

    categoryId: integer('category_id')
      .notNull()
      .references(() => skillCategory.id),

    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('english', coalesce("name", '') || ' ' || coalesce("description", ''))`,
    ),

    ...timestamps,
  },
  (table) => [
    index('skill_search_vector_idx').using('gin', table.searchVector),
    index('skill_category_id_idx').on(table.categoryId),
  ],
);
export default skill;

export type Skill = typeof skill.$inferSelect;
export type SkillInsert = typeof skill.$inferInsert;
