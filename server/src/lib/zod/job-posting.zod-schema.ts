import { z } from 'zod';
import { JOB_POSTING_STATUS } from '../../data/util/constants.ts';

const MIN_EXPIRATION_DAYS = 7;
const ACTIVE_JOB_POSTING_ORDER_BY = ['createdAt', 'expiresAt'] as const;
const SORT_ORDER = ['asc', 'desc'] as const;

const JobPostingSkillSchema = z.object({
  skillId: z.number().int().positive(),
  yoe: z.number().int().nonnegative().optional(),
});

export const ActiveJobPostingsRequestSchema = z.object({
  companyId: z.coerce.number().int().positive().optional(),
  skills: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
    ),
  orderBy: z.enum(ACTIVE_JOB_POSTING_ORDER_BY).default('createdAt'),
  sort: z.enum(SORT_ORDER).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const JobPostingInsertRequestSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional(),
    status: z.enum(Object.values(JOB_POSTING_STATUS)),
    expiresAt: z.coerce.date().optional(),
    skills: z.array(JobPostingSkillSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== JOB_POSTING_STATUS.PENDING_APPROVAL) {
      return;
    }

    if (!data.description) {
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'Description is required when submitting job posting for approval.',
      });
    }

    if (!data.expiresAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'expiresAt is required when submitting job posting for approval.',
      });
    } else {
      const minimumExpiresAt = new Date();
      minimumExpiresAt.setDate(minimumExpiresAt.getDate() + MIN_EXPIRATION_DAYS);

      if (data.expiresAt < minimumExpiresAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['expiresAt'],
          message: `expiresAt must be at least ${MIN_EXPIRATION_DAYS} days from now.`,
        });
      }
    }

    if (!data.skills?.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['skills'],
        message: 'At least one skill is required when submitting for approval.',
      });
    }
  });

export type ActiveJobPostingsRequest = z.infer<typeof ActiveJobPostingsRequestSchema>;
export type JobPostingInsertRequest = z.infer<typeof JobPostingInsertRequestSchema>;
