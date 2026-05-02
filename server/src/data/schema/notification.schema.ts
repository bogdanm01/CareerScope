import { integer, text, jsonb, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import { user } from './auth.schema.ts';

export const notification = pgTable('notification', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id')
    .references(() => user.id)
    .notNull(),
  payload: jsonb('payload').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  ...timestamps,
});

export type Notification = typeof notification.$inferSelect;
export type NotificationInsert = typeof notification.$inferInsert;
