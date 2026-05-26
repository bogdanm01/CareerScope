import { z } from 'zod';
import { JOB_APPLICATION_STATUS } from '../../data/util/constants.ts';

const JOB_APPLICATION_REVIEW_STATUS = [
  JOB_APPLICATION_STATUS.UNDER_REVIEW,
  JOB_APPLICATION_STATUS.ACCEPTED,
  JOB_APPLICATION_STATUS.REJECTED,
] as const;

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

export const JobApplicationUpdateRequestSchema = z
  .object({
    status: z.enum(JOB_APPLICATION_REVIEW_STATUS, {
      error: 'Status must be one of: UnderReview, Accepted, Rejected.',
    }),
    reason: z.string().trim().min(3, 'Reason must contain at least 3 characters.').max(500).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === JOB_APPLICATION_STATUS.REJECTED && !data.reason) {
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Reason is required when rejecting a job application.',
      });
    }
  });

export const ApplicationReviewCreateRequestSchema = z
  .object({
    rating: z
      .number({
        error: 'Rating is required.',
      })
      .int('Rating must be an integer.')
      .min(1, 'Rating must be at least 1.')
      .max(5, 'Rating cannot be greater than 5.'),
    comment: z
      .string({
        error: 'Comment is required.',
      })
      .trim()
      .min(3, 'Comment must contain at least 3 characters.')
      .max(1000, 'Comment cannot exceed 1000 characters.'),
  })
  .strict();

export type JobApplicationCreateRequest = z.infer<typeof JobApplicationCreateRequestSchema>;
export type JobApplicationListRequest = z.infer<typeof JobApplicationListRequestSchema>;
export type JobApplicationUpdateRequest = z.infer<typeof JobApplicationUpdateRequestSchema>;
export type ApplicationReviewCreateRequest = z.infer<typeof ApplicationReviewCreateRequestSchema>;
