import { AnyColumn, sql } from 'drizzle-orm';
import { check, timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
};

export const enumCheckConstraint = (constraintName: string, field: AnyColumn, sourceObject: Record<string, string>) => {
  const values = Object.values(sourceObject);
  const literals = sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(', '));

  return check(constraintName, sql`${field} IN (${literals})`);
};
