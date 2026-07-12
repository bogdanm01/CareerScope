import { z } from 'zod';
import { USER_ROLE } from '../../data/util/constants.ts';

const QueryBooleanSchema = z.string().trim().toLowerCase().transform((value, ctx) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  ctx.addIssue({ code: 'custom', message: 'Expected true or false.' });
  return z.NEVER;
});

export const AdminUserListRequestSchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.enum(Object.values(USER_ROLE)).optional(),
  isDeleted: QueryBooleanSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
  orderBy: z.enum(['name', 'email', 'role', 'createdAt', 'updatedAt']).default('createdAt'),
});

export const AdminUserIdSchema = z.object({ id: z.string().trim().min(1) });

export const AdminUserUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
});

export const AdminUserStatusUpdateSchema = z.object({ status: z.enum(['Active', 'Disabled']) });

export type AdminUserListRequest = z.infer<typeof AdminUserListRequestSchema>;
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;
