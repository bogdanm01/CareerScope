import { z } from 'zod';

export const CompanyListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().trim().min(2).optional(),
});

export const CompanyReviewsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CompanyListRequest = z.infer<typeof CompanyListRequestSchema>;
export type CompanyReviewsRequest = z.infer<typeof CompanyReviewsRequestSchema>;
