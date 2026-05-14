import { fetchJson } from './http';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  emailVerified?: boolean;
  image?: string | null;
  companyId?: number | null;
  dateOfBirth?: string;
  isDeleted?: boolean;
  onboardingStep?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSessionRecord = {
  id?: string;
  userId?: string;
  expiresAt?: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthSession = {
  session: AuthSessionRecord;
  user: AuthUser;
};

export type SignInPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  rememberMe?: boolean;
};

export type SignInResponse = {
  redirect: boolean;
  token: string;
  user: AuthUser;
  url?: string;
};

export type SignUpResponse = {
  token: string | null;
  user: AuthUser;
};

export type PasswordResetResponse = {
  status: boolean;
  message: string;
};

export type ResetPasswordPayload = {
  token?: string;
  newPassword: string;
};

export type SessionResponse = AuthSession | null;

export const signIn = async (payload: SignInPayload) =>
  fetchJson<SignInResponse>('/api/auth/sign-in/email', {
    method: 'POST',
    body: {
      email: payload.email,
      password: payload.password,
      rememberMe: payload.rememberMe ?? true,
    },
  });

export const signUp = async (payload: SignUpPayload) =>
  fetchJson<SignUpResponse>('/api/auth/sign-up/email', {
    method: 'POST',
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      dateOfBirth: payload.dateOfBirth,
      rememberMe: payload.rememberMe ?? true,
    },
  });

export const requestPasswordReset = async (email: string, redirectTo: string) =>
  fetchJson<PasswordResetResponse>('/api/auth/request-password-reset', {
    method: 'POST',
    body: {
      email,
      redirectTo,
    },
  });

export const resetPassword = async (payload: ResetPasswordPayload) =>
  fetchJson<{ status: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: payload.token,
      newPassword: payload.newPassword,
    },
  });

export const getSession = async () => fetchJson<SessionResponse>('/api/auth/get-session', { method: 'GET' });

export const signOut = async () => fetchJson<{ success: boolean }>('/api/auth/sign-out', { method: 'POST' });
