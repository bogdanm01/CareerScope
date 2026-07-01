import { z } from 'zod';
import {
  JOB_POSTING_EMPLOYMENT_TYPE,
  JOB_POSTING_STATUS,
  JOB_POSTING_WORK_LOCATION,
} from '../../data/util/constants.ts';

const MIN_EXPIRATION_DAYS = 7;
const MAX_EXPIRATION_DAYS = 90;
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

const JobPostingWorkLocationSchema = z.enum(Object.values(JOB_POSTING_WORK_LOCATION));
const JobPostingEmploymentTypeSchema = z.enum(Object.values(JOB_POSTING_EMPLOYMENT_TYPE));

export const JobPostingListRequestSchema = z.object({
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
  search: z.string().trim().min(2).optional(),
  status: z.enum(Object.values(JOB_POSTING_STATUS)).optional(),
});

const JobPostingUpdateBaseRequestSchema = z.object({
  title: z.string().trim().min(3).optional(),
  shortDescription: z.string().trim().max(80).optional(),
  description: z.string().trim().min(60).optional(), // TODO: Decide min length (markdown)
  workLocation: JobPostingWorkLocationSchema.optional(),
  employmentType: JobPostingEmploymentTypeSchema.optional(),
  salaryRange: z.string().trim().max(80).optional(),
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
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === JOB_POSTING_STATUS.REJECTED && !data.reason) {
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Reason is required when rejecting a job posting.',
      });
    }
  });

export const JobPostingUpdateRequestSchema = z.union([
  RecruiterJobPostingUpdateRequestSchema,
  AdminJobPostingUpdateRequestSchema,
]);

export const JobPostingReadyForApprovalSchema = z
  .object({
    title: z.string().trim().min(10, {
      error: 'Title must be at least 10 characters long when submitting for approval.',
    }),
    shortDescription: z.string().trim().min(1, {
      error: 'Short description is required when submitting job posting for approval.',
    }).max(80, {
      error: 'Short description cannot be more than 80 characters long.',
    }),
    description: z.string().trim().min(60, {
      error: 'Description is required when submitting job posting for approval.',
    }),
    expiresAt: z.coerce.date({
      error: 'expiresAt must be provided when submitting job posting for approval.',
    }),
    skills: z.array(JobPostingSkillSchema).min(1, {
      error: 'At least one skill is required when submitting for approval.',
    }),
  })
  .superRefine((data, ctx) => {
    const minimumExpiresAt = new Date();
    minimumExpiresAt.setDate(minimumExpiresAt.getDate() + MIN_EXPIRATION_DAYS);

    const maximumExpiresAt = new Date();
    maximumExpiresAt.setDate(maximumExpiresAt.getDate() + MAX_EXPIRATION_DAYS);

    if (data.expiresAt < minimumExpiresAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: `expiresAt must be at least ${MIN_EXPIRATION_DAYS} days from now.`,
      });
    }

    if (data.expiresAt > maximumExpiresAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: `expiresAt cannot be more than ${MAX_EXPIRATION_DAYS} days from now.`,
      });
    }
  });

export const JobPostingInsertRequestSchema = z
  .object({
    title: z.string().trim().min(3),
    shortDescription: z.string().trim().max(80, {
      error: 'Short description cannot be more than 80 characters long.',
    }).optional(),
    description: z.string().trim().optional(),
    workLocation: JobPostingWorkLocationSchema.optional(),
    employmentType: JobPostingEmploymentTypeSchema.optional(),
    salaryRange: z.string().trim().max(80).optional(),
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

    if (!data.shortDescription) {
      ctx.addIssue({
        code: 'custom',
        path: ['shortDescription'],
        message: 'Short description is required when submitting job posting for approval.',
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

      const maximumExpiresAt = new Date();
      maximumExpiresAt.setDate(maximumExpiresAt.getDate() + MAX_EXPIRATION_DAYS);

      if (data.expiresAt < minimumExpiresAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['expiresAt'],
          message: `expiresAt must be at least ${MIN_EXPIRATION_DAYS} days from now.`,
        });
      }

      if (data.expiresAt > maximumExpiresAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['expiresAt'],
          message: `expiresAt cannot be more than ${MAX_EXPIRATION_DAYS} days from now.`,
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

export type JobPostingListRequest = z.infer<typeof JobPostingListRequestSchema>;
export type JobPostingInsertRequest = z.infer<typeof JobPostingInsertRequestSchema>;
export type RecruiterJobPostingUpdateRequest = z.infer<typeof RecruiterJobPostingUpdateRequestSchema>;
export type AdminJobPostingUpdateRequest = z.infer<typeof AdminJobPostingUpdateRequestSchema>;
export type JobPostingUpdateRequest = z.infer<typeof JobPostingUpdateRequestSchema>;
export type JobPostingReadyForApproval = z.infer<typeof JobPostingReadyForApprovalSchema>;
export type JobPostingDetailInclude = (typeof JOB_POSTING_DETAIL_INCLUDE)[number];
export type JobPostingDetailRequest = z.infer<typeof JobPostingDetailRequestSchema>;
