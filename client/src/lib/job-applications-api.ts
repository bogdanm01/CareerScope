import { apiDelete, apiGet, apiPatch, apiPost } from './panel-api';
import { getApiBaseUrl, getSafeErrorMessage, HttpError } from './http';

export type JobApplicationStatus = string;

export type JobApplicationReviewStatus = 'UnderReview' | 'Accepted' | 'Rejected';
export type JobApplicationActivityStatus = 'Pending' | 'Scheduled' | 'Completed' | 'Skipped' | 'Cancelled';

export type JobApplicationUpdatePayload = {
  status: JobApplicationReviewStatus;
  reason?: string;
};

export type CandidateJobApplicationUpdatePayload = {
  status: 'Withdrawn';
};

export type CandidateJobApplicationsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
};

export type ApplicationReviewCreatePayload = {
  rating: number;
  comment: string;
};

export type ApplicationReview = {
  id: number;
  jobApplicationId: number | null;
  companyId: number | null;
  rating: number;
  comment: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationActivity = {
  id: number;
  jobApplicationId: number;
  templateActivityId: number | null;
  title: string;
  description: string | null;
  orderIndex: number;
  status: JobApplicationActivityStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  internalNote?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationActivityPayload = {
  title?: string;
  description?: string | null;
  orderIndex?: number;
  status?: JobApplicationActivityStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  internalNote?: string | null;
};

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

export const getJobApplicationActivities = async (jobApplicationId: number) =>
  apiGet<JobApplicationActivity[]>(`/api/job-applications/${jobApplicationId}/activities`);

export const createJobApplicationActivity = async (
  jobApplicationId: number,
  payload: JobApplicationActivityPayload,
) => apiPost<JobApplicationActivity>(`/api/job-applications/${jobApplicationId}/activities`, payload);

export const updateJobApplicationActivity = async (
  activityId: number,
  payload: JobApplicationActivityPayload,
) => apiPatch<JobApplicationActivity>(`/api/job-application-activities/${activityId}`, payload);

export const deleteJobApplicationActivity = async (activityId: number) =>
  apiDelete<{ id: number }>(`/api/job-application-activities/${activityId}`);

export const getMyJobApplications = async (query?: CandidateJobApplicationsQuery) =>
  apiGet<CandidateJobApplicationListItem[]>('/api/me/applications', { query });

export const getMyJobApplication = async (jobApplicationId: number) =>
  apiGet<JobApplicationDetail>(`/api/me/applications/${jobApplicationId}`);

export const getMyJobApplicationActivities = async (jobApplicationId: number) =>
  apiGet<JobApplicationActivity[]>(`/api/me/applications/${jobApplicationId}/activities`);

export const updateMyJobApplication = async (
  jobApplicationId: number,
  payload: CandidateJobApplicationUpdatePayload,
) => apiPatch(`/api/me/applications/${jobApplicationId}`, payload);

export const deleteMyJobApplication = async (jobApplicationId: number) =>
  apiDelete<{ id: number }>(`/api/me/applications/${jobApplicationId}`);

export const applyToJobPosting = async (jobPostingId: number) =>
  apiPost(`/api/job-postings/${jobPostingId}/applications`, {});

export const updateJobApplication = async (jobApplicationId: number, payload: JobApplicationUpdatePayload) =>
  apiPatch(`/api/job-applications/${jobApplicationId}`, payload);

export const createApplicationReview = async (jobApplicationId: number, payload: ApplicationReviewCreatePayload) =>
  apiPost<ApplicationReview>(`/api/job-applications/${jobApplicationId}/review`, payload);

const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${path}` : new URL(path, baseUrl).toString();
};

const readDownloadErrorMessage = async (response: Response) => {
  const text = await response.text().catch(() => '');

  if (text) {
    try {
      const payload = JSON.parse(text) as { message?: unknown };

      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
    } catch {
      // Fall through to sanitized text.
    }
  }

  return getSafeErrorMessage(text, response.statusText);
};

const getFileNameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return fileNameMatch?.[1] ?? null;
};

export const downloadJobApplicationCandidateCv = async (jobApplicationId: number) => {
  const response = await fetch(buildApiUrl(`/api/job-applications/${jobApplicationId}/cv`), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new HttpError(await readDownloadErrorMessage(response), response.status);
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromContentDisposition(response.headers.get('content-disposition')) ?? 'candidate-cv.pdf',
  };
};
