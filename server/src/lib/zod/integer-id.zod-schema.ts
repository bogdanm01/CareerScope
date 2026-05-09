import { z } from 'zod';

export const IntegerIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
