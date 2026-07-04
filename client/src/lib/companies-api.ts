import { apiGet } from './panel-api';
import type { ApiPagination } from './panel-api';
import type { JobPostingListItem } from './job-postings-api';

export type PublicCompany = {
  id: number;
  name: string;
  shortDescription: string | null;
  description: string | null;
  foundingYear: number | null;
  numberOfEmployees: number | null;
  address: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
};

export type PublicCompanyListItem = {
  id: number;
  name: string;
  shortDescription: string | null;
  foundingYear: number | null;
  numberOfEmployees: number | null;
  address: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  openPositionsCount: number;
};

export type CompanyReviewListItem = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string | null;
  candidate: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type CompanyReviewsResponse = {
  data: CompanyReviewListItem[];
  pagination?: ApiPagination;
};

export const getCompanies = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<PublicCompanyListItem[]>('/api/companies', { query });

export const getCompany = async (companyId: number) => apiGet<PublicCompany>(`/api/companies/${companyId}`);

export const getCompanyReviews = async (
  companyId: number,
  query?: Record<string, string | number | boolean | null | undefined>,
) => apiGet<CompanyReviewListItem[]>(`/api/companies/${companyId}/reviews`, { query });

export const getCompanyJobPostings = async (
  companyId: number,
  query?: Record<string, string | number | boolean | null | undefined>,
) => apiGet<JobPostingListItem[]>(`/api/companies/${companyId}/job-postings`, { query });
