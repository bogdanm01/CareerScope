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

export const JOB_POSTING_WORK_LOCATION = {
  REMOTE: 'Remote',
  ON_SITE: 'OnSite',
  HYBRID: 'Hybrid',
} as const;

export const JOB_POSTING_EMPLOYMENT_TYPE = {
  FULL_TIME: 'FullTime',
  PART_TIME: 'PartTime',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
  OTHER: 'Other',
} as const;

export const JOB_APPLICATION_STATUS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'UnderReview',
  REJECTED: 'Rejected',
  ACCEPTED: 'Accepted',
  WITHDRAWN: 'Withdrawn',
} as const;

export const ONBOARDING_STATUS = {
  PROFILE_CREATED: 'ProfileCreated',
  SKILLS_ADDED: 'SkillsAdded',
  CV_UPLOADED: 'CvUploaded',
  COMPANY_PENDING_APPROVAL: 'CompanyPendingApproval',
  COMPANY_REJECTED: 'CompanyRejected',
  COMPLETED: 'Completed',
} as const;

export const COMPANY_APPROVAL_STATUS = {
  PENDING_APPROVAL: 'PendingApproval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type JobPostingWorkLocation = (typeof JOB_POSTING_WORK_LOCATION)[keyof typeof JOB_POSTING_WORK_LOCATION];
export type JobPostingEmploymentType =
  (typeof JOB_POSTING_EMPLOYMENT_TYPE)[keyof typeof JOB_POSTING_EMPLOYMENT_TYPE];
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUS)[keyof typeof JOB_APPLICATION_STATUS];
export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];
export type CompanyApprovalStatus = (typeof COMPANY_APPROVAL_STATUS)[keyof typeof COMPANY_APPROVAL_STATUS];
