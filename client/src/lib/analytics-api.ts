import { apiGet } from './panel-api';

export type AnalyticsRole = 'Candidate' | 'Recruiter' | 'Admin';

export type AnalyticsStat = {
  key: string;
  label: string;
  value: number;
};

export type AnalyticsChartRecord = Record<string, string | number | null>;

export type AnalyticsOverview = {
  role: AnalyticsRole;
  range: {
    from: string;
    to: string;
  };
  stats: AnalyticsStat[];
  charts: Record<string, AnalyticsChartRecord[]>;
};

export type AnalyticsOverviewQuery = {
  from?: string;
  to?: string;
  view?: 'overview' | 'postings';
};

export type RecruiterJobPostingAnalytics = {
  role: 'Recruiter';
  range: {
    from: string;
    to: string;
  };
  jobPosting: {
    id: number;
    title: string | null;
    status: string;
    workLocation: string | null;
    employmentType: string | null;
    salaryRange: string | null;
    expiresAt: string | null;
  };
  stats: AnalyticsStat[];
  charts: Record<string, AnalyticsChartRecord[]>;
};

export const getAnalyticsOverview = async (query?: AnalyticsOverviewQuery) =>
  apiGet<AnalyticsOverview>('/api/analytics/overview', { query });

export const getRecruiterJobPostingAnalytics = async (
  jobPostingId: number,
  query?: { from?: string; to?: string },
) =>
  apiGet<RecruiterJobPostingAnalytics>(
    `/api/analytics/recruiter/job-postings/${jobPostingId}`,
    { query },
  );
