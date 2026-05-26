import { apiGet, apiPut, apiUpload } from './panel-api';

export type CandidateOnboardingStatusResponse = {
  onboardingStatus: string;
};

export type CandidateSkillPayload = {
  skills: {
    id: number;
    yearsOfExperience: number;
  }[];
};

export type CandidateCvUploadResponse = {
  fileName: string;
  mimeType: string;
  size: number;
  cvUrl: string;
  onboardingStatus: string;
};

export const getOnboardingStatus = async () => apiGet<CandidateOnboardingStatusResponse>('/api/me/onboarding-status');

export const replaceCandidateSkills = async (payload: CandidateSkillPayload) => apiPut('/api/me/skills', payload);

export const uploadCandidateCv = async (file: File) => {
  const formData = new FormData();
  formData.append('cv', file);

  return apiUpload<CandidateCvUploadResponse>('/api/me/cv', formData);
};
