import { z } from 'zod';

export const SkillListRequestSchema = z.object({
  categoryId: z.coerce
    .number({
      error: 'Category id must be a number.',
    })
    .int('Category id must be an integer.')
    .positive('Category id must be a positive integer.')
    .optional(),
  search: z
    .string()
    .trim()
    .min(2, 'Search term must contain at least 2 characters.')
    .max(100, 'Search term cannot exceed 100 characters.')
    .optional(),
});

export type SkillListRequest = z.infer<typeof SkillListRequestSchema>;
