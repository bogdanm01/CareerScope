import { apiPost, apiUpload } from './panel-api';

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
  logoFile?: File | null;
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

export const registerRecruiter = async (payload: RecruiterOnboardingPayload) => {
  const { logoFile, ...requestPayload } = payload;

  if (!logoFile) {
    const response = await apiPost<RecruiterOnboardingResponse>(
      '/api/onboarding/recruiter',
      requestPayload as unknown as Record<string, unknown>,
    );

    return response.data;
  }

  const formData = new FormData();
  formData.append('payload', JSON.stringify(requestPayload));
  formData.append('logo', logoFile);

  const response = await apiUpload<RecruiterOnboardingResponse>('/api/onboarding/recruiter', formData);

  return response.data;
};
