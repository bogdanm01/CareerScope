import { apiGet, apiPost } from './panel-api';

export type JobApplicationStatus = string;

export type RecruiterJobApplicationListItem = {
  id: number;
  userId: string;
  jobPostingId: number;
  status: JobApplicationStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    fullName: string;
    email: string;
    image: string | null;
  };
};

export type CandidateJobApplicationListItem = {
  id: number;
  userId: string;
  jobPostingId: number;
  status: JobApplicationStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  jobPosting: {
    id: number;
    title: string | null;
    status: string;
    expiresAt: string | null;
    company: {
      id: number;
      name: string;
      logoUrl: string | null;
    };
  };
};

export type JobApplicationDetail = {
  id: number;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    skills: {
      id: number;
      name: string;
      requiresYearsOfExperience: boolean;
      yearsOfExperience: number | null;
    }[];
  };
  jobPosting: {
    id: number;
    title: string | null;
    description: string | null;
    status: string;
    company: {
      id: number;
      name: string;
      logoUrl: string | null;
    };
    skills: {
      id: number;
      name: string;
      requiredYearsOfExperience: number | null;
    }[];
  };
};

export const getRecruiterJobApplications = async (jobPostingId: number) =>
  apiGet<RecruiterJobApplicationListItem[]>(`/api/job-postings/${jobPostingId}/applications`);

export const getJobApplicationDetail = async (jobApplicationId: number) =>
  apiGet<JobApplicationDetail>(`/api/job-applications/${jobApplicationId}`);

export const getMyJobApplications = async () => apiGet<CandidateJobApplicationListItem[]>('/api/me/applications');

export const getMyJobApplication = async (jobApplicationId: number) =>
  apiGet<JobApplicationDetail>(`/api/me/applications/${jobApplicationId}`);

export const applyToJobPosting = async (jobPostingId: number) =>
  apiPost(`/api/job-postings/${jobPostingId}/applications`, {});
