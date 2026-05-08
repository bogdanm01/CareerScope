import { z } from 'zod';
import { JOB_POSTING_STATUS } from '../../data/util/constants.ts';

const MIN_EXPIRATION_DAYS = 7;
const ACTIVE_JOB_POSTING_ORDER_BY = ['createdAt', 'expiresAt'] as const;
const SORT_ORDER = ['asc', 'desc'] as const;
const CREATE_JOB_POSTING_STATUS = [JOB_POSTING_STATUS.DRAFT, JOB_POSTING_STATUS.PENDING_APPROVAL] as const;
const JOB_POSTING_DETAIL_INCLUDE = ['skills', 'statusHistory', 'company'] as const;
const RECRUITER_UPDATE_JOB_POSTING_STATUS = [
  JOB_POSTING_STATUS.ACTIVE,
  JOB_POSTING_STATUS.DRAFT,
  JOB_POSTING_STATUS.PENDING_APPROVAL,
  JOB_POSTING_STATUS.PAUSED,
  JOB_POSTING_STATUS.CLOSED,
] as const;
const ADMIN_UPDATE_JOB_POSTING_STATUS = [
  JOB_POSTING_STATUS.ACTIVE,
  JOB_POSTING_STATUS.REJECTED,
  JOB_POSTING_STATUS.CLOSED,
] as const;

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

export const JobPostingsRequestSchema = z.object({
  companyId: z.coerce.number().int().positive().optional(),
  status: z.enum(Object.values(JOB_POSTING_STATUS)).optional(),
  orderBy: z.enum(ACTIVE_JOB_POSTING_ORDER_BY).default('createdAt'),
  sort: z.enum(SORT_ORDER).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const JobPostingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const JobPostingUpdateBaseRequestSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(60).optional(), // TODO: Decide min length (markdown)
  expiresAt: z.coerce.date().optional(),
  skills: z.array(JobPostingSkillSchema).optional(),
});

export const RecruiterJobPostingUpdateRequestSchema = JobPostingUpdateBaseRequestSchema.extend({
  status: z.enum(RECRUITER_UPDATE_JOB_POSTING_STATUS).optional(),
})
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const AdminJobPostingUpdateRequestSchema = z
  .object({
    status: z.enum(ADMIN_UPDATE_JOB_POSTING_STATUS),
    reason: z.string().trim().min(3).optional(),
  })
  .strict();

export const JobPostingUpdateRequestSchema = z.union([
  RecruiterJobPostingUpdateRequestSchema,
  AdminJobPostingUpdateRequestSchema,
]);

export const JobPostingInsertRequestSchema = z
  .object({
    title: z.string().trim().min(3),
    description: z.string().trim().optional(),
    status: z.enum(CREATE_JOB_POSTING_STATUS, {
      error: 'Invalid status. New job postings can only be created as Draft or PendingApproval.',
    }),
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

export const JobPostingDetailRequestSchema = z.object({
  id: z.coerce.number().int().positive(),
  include: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((it) => it.trim())
            .filter(Boolean)
        : [],
    )
    .pipe(z.array(z.enum(JOB_POSTING_DETAIL_INCLUDE))),
});

export type ActiveJobPostingsRequest = z.infer<typeof ActiveJobPostingsRequestSchema>;
export type JobPostingsRequest = z.infer<typeof JobPostingsRequestSchema>;
export type JobPostingInsertRequest = z.infer<typeof JobPostingInsertRequestSchema>;
export type JobPostingIdParam = z.infer<typeof JobPostingIdParamSchema>;
export type RecruiterJobPostingUpdateRequest = z.infer<typeof RecruiterJobPostingUpdateRequestSchema>;
export type AdminJobPostingUpdateRequest = z.infer<typeof AdminJobPostingUpdateRequestSchema>;
export type JobPostingUpdateRequest = z.infer<typeof JobPostingUpdateRequestSchema>;
export type JobPostingDetailInclude = (typeof JOB_POSTING_DETAIL_INCLUDE)[number];
export type JobPostingDetailRequest = z.infer<typeof JobPostingDetailRequestSchema>;
