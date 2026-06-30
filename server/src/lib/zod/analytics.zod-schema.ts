import z from 'zod';

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format.');

export const AnalyticsOverviewRequestSchema = z
  .object({
    from: IsoDateSchema.optional(),
    to: IsoDateSchema.optional(),
  })
  .refine(
    (value) => {
      if (!value.from || !value.to) {
        return true;
      }

      return value.from <= value.to;
    },
    {
      message: 'From date must be before or equal to to date.',
      path: ['from'],
    },
  );

export type AnalyticsOverviewRequest = z.infer<typeof AnalyticsOverviewRequestSchema>;
