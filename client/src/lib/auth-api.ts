import { authClient } from './auth-client';
import type { auth as serverAuth } from '../../../server/src/config/auth.ts';

export type AuthSession = typeof serverAuth.$Infer.Session;
export type AuthUser = AuthSession['user'];
export type AuthSessionRecord = AuthSession['session'];

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

export type PasswordResetResponse = {
  status: boolean;
  message: string;
};

export type ResetPasswordPayload = {
  token?: string;
  newPassword: string;
};

export type SessionResponse = AuthSession | null;

export const signIn = async (payload: SignInPayload) => {
  const result = await authClient.signIn.email({
    email: payload.email,
    password: payload.password,
    rememberMe: payload.rememberMe ?? true,
  });

  if (result.error) {
    throw result.error;
  }

  return result.data as unknown as { user: AuthUser; token: string };
};

export const signUp = async (payload: SignUpPayload) => {
  const body = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    firstName: payload.firstName,
    lastName: payload.lastName,
    dateOfBirth: payload.dateOfBirth,
    rememberMe: payload.rememberMe ?? true,
  } as Record<string, unknown>;

  const result = await authClient.signUp.email(body as never);

  if (result.error) {
    throw result.error;
  }

  return result.data as unknown as { user: AuthUser; token: string };
};

export const requestPasswordReset = async (email: string, redirectTo: string) => {
  const result = await authClient.requestPasswordReset({
    email,
    redirectTo,
  });

  if (result.error) {
    throw result.error;
  }

  return result.data as unknown as AuthSession;
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const result = await authClient.resetPassword(payload);

  if (result.error) {
    throw result.error;
  }

  return result.data;
};

export const getSession = async () => {
  const result = await authClient.getSession();

  if (result.error) {
    throw result.error;
  }

  return result.data;
};

export const signOut = async () => {
  const result = await authClient.signOut();

  if (result.error) {
    throw result.error;
  }

  return result.data;
};
