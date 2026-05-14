export const USER_ROLE = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  CANDIDATE: 'Candidate',
} as const;

export const JOB_POSTING_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'PendingApproval',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CLOSED: 'Closed',
  EXPIRED: 'Expired',
} as const;

export const JOB_APPLICATION_STATUS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'UnderReview',
  REJECTED: 'Rejected',
  ACCEPTED: 'Accepted',
  WITHDRAWN: 'Withdrawn',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUS)[keyof typeof JOB_APPLICATION_STATUS];
