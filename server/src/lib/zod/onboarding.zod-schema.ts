import z from 'zod';

export const RecruiterOnboardingRequestSchema = z.object({
  recruiter: z.object({
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    email: z.email('Valid recruiter email is required.'),
    password: z.string().min(8, 'Password must contain at least 8 characters.'),
    dateOfBirth: z.coerce.date({ error: 'Valid date of birth is required.' }),
  }),
  company: z.object({
    name: z.string().trim().min(1, 'Company name is required.'),
    taxId: z.string().trim().min(1, 'Company tax id is required.'),
    shortDescription: z.string().trim().max(160, 'Company short description cannot be longer than 160 characters.').optional(),
    description: z.string().trim().optional(),
    foundingYear: z.number().int('Founding year must be an integer.').positive('Founding year must be positive.').optional(),
    numberOfEmployees: z
      .number()
      .int('Number of employees must be an integer.')
      .positive('Number of employees must be positive.')
      .optional(),
    address: z.string().trim().min(1, 'Company address is required.'),
    logoUrl: z.url('Logo URL must be valid.').optional(),
    websiteUrl: z.url('Website URL must be valid.').optional(),
  }),
});

export const RejectRecruiterOnboardingRequestSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters long.'),
});

export const PendingRecruiterOnboardingListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type RecruiterOnboardingRequest = z.infer<typeof RecruiterOnboardingRequestSchema>;
export type RejectRecruiterOnboardingRequest = z.infer<typeof RejectRecruiterOnboardingRequestSchema>;
export type PendingRecruiterOnboardingListRequest = z.infer<typeof PendingRecruiterOnboardingListRequestSchema>;
