import { z } from 'zod';
import { JOB_POSTING_STATUS } from '../../data/util/constants.ts';

// TODO: add min, max etc, detailed validation
export const JobPostingSchema = z.object({
  title: z.string().trim().min(5),
  description: z.string().optional(), // ? not required for draft
  status: z.enum(Object.values(JOB_POSTING_STATUS), { error: 'Invalid status value provided.' }),
  expiresAt: z.coerce.date({ error: 'expiresAt is required and must be a valid date.' }).nonoptional(),
});
