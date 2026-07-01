import { apiGet, apiPatch, apiPost } from './panel-api';
import type { JobPostingListItem } from './job-postings-api';

export type PendingRecruiterOnboardingRequest = {
  company: {
    id: number;
    name: string;
    taxId: string;
    shortDescription: string | null;
    description: string | null;
    foundingYear: number | null;
    numberOfEmployees: number | null;
    address: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    approvalStatus: string;
  };
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string | null;
  };
};

export type ApprovedRecruiterOnboardingRequest = {
  company: {
    id: number;
    name: string;
    isApproved: boolean;
    approvalStatus: string;
    approvedAt: string | null;
  };
  recruiter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    onboardingStatus: string;
  };
};

export type RejectedRecruiterOnboardingRequest = {
  company: {
    id: number;
    name: string;
    isApproved: boolean;
    approvalStatus: string;
    approvalRejectionReason: string | null;
  };
  recruiter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    onboardingStatus: string;
  };
};

export type AdminCompanyListItem = {
  id: number;
  name: string;
  taxId: string;
  shortDescription: string | null;
  description: string | null;
  foundingYear: number | null;
  numberOfEmployees: number | null;
  address: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  isApproved: boolean;
  approvalStatus: string;
  approvalRejectionReason: string | null;
  approvedAt: string | null;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const getAdminCompanies = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<AdminCompanyListItem[]>('/api/admin/companies', { query });

export const getAdminCompany = async (companyId: number) =>
  apiGet<AdminCompanyListItem>(`/api/admin/companies/${companyId}`);

export const getPendingRecruiterOnboardingRequests = async (
  query?: Record<string, string | number | boolean | null | undefined>,
) => apiGet<PendingRecruiterOnboardingRequest[]>('/api/onboarding/recruiter/pending', { query });

export const approveRecruiterOnboarding = async (companyId: number) =>
  apiPost<ApprovedRecruiterOnboardingRequest>(`/api/onboarding/recruiter/${companyId}/approve`, {});

export const rejectRecruiterOnboarding = async (companyId: number, reason: string) =>
  apiPost<RejectedRecruiterOnboardingRequest>(`/api/onboarding/recruiter/${companyId}/reject`, { reason });

export const getPendingJobPostings = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<JobPostingListItem[]>('/api/job-postings', { query: { status: 'PendingApproval', ...query } });

export const getAdminJobPostings = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<JobPostingListItem[]>('/api/job-postings', { query });

export const approveJobPosting = async (jobPostingId: number) =>
  apiPatch(`/api/job-postings/${jobPostingId}`, { status: 'Active' });

export const rejectJobPosting = async (jobPostingId: number, reason: string) =>
  apiPatch(`/api/job-postings/${jobPostingId}`, { status: 'Rejected', reason });
