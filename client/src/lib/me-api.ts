import { apiGet, apiPut, apiUpload } from './panel-api';

export type CandidateOnboardingStatusResponse = {
  onboardingStatus: string;
};

export type MeUserSkill = {
  id: number;
  name: string;
  slug: string;
  description: string;
  yearsOfExperience: number;
};

export type MeUserResponse = {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  image: string | null;
  cvUrl: string | null;
  role: string;
  dateOfBirth: string;
  onboardingStatus: string;
  company: {
    id: number;
    name: string;
    logoUrl: string | null;
  } | null;
  skills: MeUserSkill[];
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

export const getMe = async () => apiGet<MeUserResponse>('/api/me');

export const getOnboardingStatus = async () => apiGet<CandidateOnboardingStatusResponse>('/api/me/onboarding-status');

export const replaceCandidateSkills = async (payload: CandidateSkillPayload) => apiPut('/api/me/skills', payload);

export const uploadCandidateCv = async (file: File) => {
  const formData = new FormData();
  formData.append('cv', file);

  return apiUpload<CandidateCvUploadResponse>('/api/me/cv', formData);
};
