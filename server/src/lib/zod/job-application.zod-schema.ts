import { z } from 'zod';

export const JobApplicationCreateRequestSchema = z
  .object({
    status: z.never({
      error: 'status cannot be provided when creating a job application.',
    }),
  })
  .strict();

export type JobApplicationCreateRequest = z.infer<typeof JobApplicationCreateRequestSchema>;
