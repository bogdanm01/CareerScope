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

export const getAnalyticsOverview = async (query?: { from?: string; to?: string }) =>
  apiGet<AnalyticsOverview>('/api/analytics/overview', { query });
