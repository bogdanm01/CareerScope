import { fetchJson } from './http';

export type RecruiterOnboardingPayload = {
  recruiter: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
  };
  company: {
    name: string;
    taxId: string;
    shortDescription?: string;
    description?: string;
    foundingYear?: number;
    numberOfEmployees?: number;
    address: string;
    logoUrl?: string;
    websiteUrl?: string;
  };
};

export type RecruiterOnboardingResponse = {
  recruiter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    onboardingStatus: string;
  };
  company: {
    id: number;
    name: string;
    isApproved: boolean;
  };
};

export const registerRecruiter = async (payload: RecruiterOnboardingPayload) =>
  fetchJson<RecruiterOnboardingResponse>('/api/onboarding/recruiter', {
    method: 'POST',
    body: payload,
  });
