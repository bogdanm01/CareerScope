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

export const CompanyChangeRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Company name is required.'),
    taxId: z.string().trim().min(1, 'Company tax id is required.'),
    shortDescription: z.string().trim().max(160, 'Company short description cannot be longer than 160 characters.').nullable().optional(),
    description: z.string().trim().nullable().optional(),
    foundingYear: z.number().int('Founding year must be an integer.').positive('Founding year must be positive.').nullable().optional(),
    numberOfEmployees: z
      .number()
      .int('Number of employees must be an integer.')
      .positive('Number of employees must be positive.')
      .nullable()
      .optional(),
    address: z.string().trim().min(1, 'Company address is required.'),
    logoUrl: z.url('Logo URL must be valid.').nullable().optional(),
    websiteUrl: z.url('Website URL must be valid.').nullable().optional(),
  })
  .strict();

export type CompanyListRequest = z.infer<typeof CompanyListRequestSchema>;
export type CompanyReviewsRequest = z.infer<typeof CompanyReviewsRequestSchema>;
export type CompanyChangeRequestPayload = z.infer<typeof CompanyChangeRequestSchema>;
