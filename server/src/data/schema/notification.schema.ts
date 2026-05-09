import { integer, text, jsonb, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from '../util/utils.ts';
import { user } from './auth.schema.ts';

export const notification = pgTable('notification', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text()
    .references(() => user.id)
    .notNull(),
  payload: jsonb().notNull(),
  readAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export type Notification = typeof notification.$inferSelect;
export type NotificationInsert = typeof notification.$inferInsert;
