import { apiDelete, apiGet, apiPatch, apiPost } from './panel-api';

export type JobPostingStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Rejected'
  | 'Active'
  | 'Paused'
  | 'Closed'
  | 'Expired';

export type JobPostingWorkLocation = 'Remote' | 'OnSite' | 'Hybrid';
export type JobPostingEmploymentType = 'FullTime' | 'PartTime' | 'Contract' | 'Internship' | 'Temporary' | 'Other';

export type JobPostingCompany = {
  id: number;
  name: string;
  logo: string | null;
  websiteUrl?: string | null;
  shortDescription?: string | null;
  address?: string | null;
};

export type JobPostingSkill = {
  id: number;
  name: string;
  yoe?: number | null;
};

export type JobPostingListItem = {
  id: number;
  title: string | null;
  shortDescription?: string | null;
  workLocation?: JobPostingWorkLocation | string | null;
  employmentType?: JobPostingEmploymentType | string | null;
  salaryRange?: string | null;
  status: JobPostingStatus | string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: JobPostingCompany;
};

export type JobPostingDetail = JobPostingListItem & {
  description?: string | null;
  skills?: JobPostingSkill[];
  statusHistory?: {
    id: number;
    status: string;
    reason: string | null;
    createdAt: string;
  }[];
};

export type JobPostingCreatePayload = {
  title: string;
  shortDescription?: string;
  description?: string;
  workLocation?: JobPostingWorkLocation;
  employmentType?: JobPostingEmploymentType;
  salaryRange?: string;
  status: JobPostingStatus | 'Draft' | 'PendingApproval';
  expiresAt?: string;
  skills?: {
    skillId: number;
    yoe?: number;
  }[];
};

export type JobPostingUpdatePayload = {
  title?: string;
  shortDescription?: string;
  description?: string;
  workLocation?: JobPostingWorkLocation;
  employmentType?: JobPostingEmploymentType;
  salaryRange?: string;
  status?: JobPostingStatus | 'Draft' | 'PendingApproval' | 'Active' | 'Paused' | 'Closed';
  expiresAt?: string;
  skills?: {
    skillId: number;
    yoe?: number;
  }[];
};

export const getActiveJobPostings = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<JobPostingListItem[]>('/api/job-postings/active', { query });

export const getRecruiterJobPostings = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<JobPostingListItem[]>('/api/job-postings', { query });

export const getJobPostingDetail = async (
  jobPostingId: number,
  include?: Array<'skills' | 'statusHistory' | 'company'>,
) =>
  apiGet<JobPostingDetail>(`/api/job-postings/${jobPostingId}`, {
    query: include?.length ? { include: include.join(',') } : undefined,
  });

export const createJobPosting = async (payload: JobPostingCreatePayload) => apiPost<JobPostingDetail>('/api/job-postings', payload);

export const updateJobPosting = async (jobPostingId: number, payload: JobPostingUpdatePayload) =>
  apiPatch<JobPostingDetail>(`/api/job-postings/${jobPostingId}`, payload);

export const deleteJobPosting = async (jobPostingId: number) => apiDelete<{ id: number }>(`/api/job-postings/${jobPostingId}`);

export const getJobPostingApplications = async (
  jobPostingId: number,
  query?: Record<string, string | number | boolean | null | undefined>,
) => apiGet<unknown[]>(`/api/job-postings/${jobPostingId}/applications`, { query });
