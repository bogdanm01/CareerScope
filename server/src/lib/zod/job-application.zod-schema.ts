import { z } from 'zod';

export const JobApplicationCreateRequestSchema = z
  .object({
    status: z.never({
      error: 'status cannot be provided when creating a job application.',
    }).optional(),
  })
  .strict();

export const JobApplicationListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type JobApplicationCreateRequest = z.infer<typeof JobApplicationCreateRequestSchema>;
export type JobApplicationListRequest = z.infer<typeof JobApplicationListRequestSchema>;
