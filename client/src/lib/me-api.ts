import { apiGet, apiPatch, apiPut, apiUpload } from './panel-api';

export type CandidateOnboardingStatusResponse = {
  onboardingStatus: string;
};

export type MeUserSkill = {
  id: number;
  name: string;
  slug: string;
  description: string;
  requiresYearsOfExperience: boolean;
  yearsOfExperience: number | null;
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

export type CompanyChangeRequest = {
  id: number;
  status: string;
  rejectionReason: string | null;
  name: string;
  taxId: string;
  shortDescription: string | null;
  description: string | null;
  foundingYear: number | null;
  numberOfEmployees: number | null;
  address: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecruiterCompanyProfile = {
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
  pendingChangeRequest: CompanyChangeRequest | null;
};

export type CompanyChangeRequestPayload = {
  name: string;
  taxId: string;
  shortDescription?: string | null;
  description?: string | null;
  foundingYear?: number | null;
  numberOfEmployees?: number | null;
  address: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
};

export type CandidateSkillPayload = {
  skills: {
    id: number;
    yearsOfExperience?: number | null;
  }[];
};

export type CandidateCvUploadResponse = {
  fileName: string;
  mimeType: string;
  size: number;
  cvUrl: string;
  onboardingStatus: string;
};

export type ProfileUpdatePayload = {
  firstName: string;
  lastName: string;
};

export type ProfileUpdateResponse = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  image: string | null;
};

export const getMe = async () => apiGet<MeUserResponse>('/api/me');

export const getMyCompany = async () => apiGet<RecruiterCompanyProfile>('/api/me/company');

export const submitCompanyChangeRequest = async (payload: CompanyChangeRequestPayload) =>
  apiPatch<CompanyChangeRequest>('/api/me/company-change-request', payload);

export const getOnboardingStatus = async () => apiGet<CandidateOnboardingStatusResponse>('/api/me/onboarding-status');

export const replaceCandidateSkills = async (payload: CandidateSkillPayload) => apiPut('/api/me/skills', payload);

export const updateMyProfile = async (payload: ProfileUpdatePayload) =>
  apiPatch<ProfileUpdateResponse>('/api/me/profile', payload);

export const uploadCandidateCv = async (file: File) => {
  const formData = new FormData();
  formData.append('cv', file);

  return apiUpload<CandidateCvUploadResponse>('/api/me/cv', formData);
};

export const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  return apiUpload<ProfileUpdateResponse>('/api/me/profile-picture', formData);
};
