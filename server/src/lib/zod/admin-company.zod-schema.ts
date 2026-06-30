import { z } from 'zod';
import { COMPANY_APPROVAL_STATUS } from '../../data/util/constants.ts';

const SORT_ORDER = ['asc', 'desc'] as const;
const ADMIN_COMPANY_ORDER_BY = [
  'id',
  'name',
  'taxId',
  'approvalStatus',
  'isApproved',
  'isDeleted',
  'approvedAt',
  'foundingYear',
  'numberOfEmployees',
] as const;

const QueryBooleanSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value, ctx) => {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    ctx.addIssue({
      code: 'custom',
      message: 'Expected true or false.',
    });

    return z.NEVER;
  });

export const AdminCompanyListRequestSchema = z.object({
  search: z.string().trim().min(1).optional(),
  approvalStatus: z.enum(Object.values(COMPANY_APPROVAL_STATUS)).optional(),
  isApproved: QueryBooleanSchema.optional(),
  isDeleted: QueryBooleanSchema.optional().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sort: z.enum(SORT_ORDER).default('desc'),
  orderBy: z.enum(ADMIN_COMPANY_ORDER_BY).default('id'),
});

export type AdminCompanyListRequest = z.infer<typeof AdminCompanyListRequestSchema>;
