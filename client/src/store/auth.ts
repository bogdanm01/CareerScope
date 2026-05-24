import { atom } from 'jotai';
import { authClient } from '../lib/auth-client';
import { registerRecruiter, type RecruiterOnboardingPayload, type RecruiterOnboardingResponse } from '../lib/onboarding-api';
import type { auth as serverAuth } from '../../../server/src/config/auth.ts';

type AuthSession = typeof serverAuth.$Infer.Session;
type AuthUser = AuthSession['user'];
type AuthSessionRecord = AuthSession['session'];

const createFallbackSession = (user: AuthUser, token?: string | null): AuthSession =>
  ({
    session: {
      id: `fallback-${user.id}`,
      userId: user.id,
      token: token ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    } as AuthSessionRecord,
    user,
  } as AuthSession);

const loadSession = async (fallback?: { user?: AuthUser; token?: string | null }) => {
  const sessionResponse = await authClient.getSession();

  if (sessionResponse.data) {
    return sessionResponse.data as unknown as AuthSession;
  }

  if (fallback?.user) {
    return createFallbackSession(fallback.user, fallback.token);
  }

  return null;
};

const readAuthErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

export const authSessionAtom = atom<AuthSession | null>(null);
export const authHydratedAtom = atom(false);
export const authLoadingAtom = atom(false);
export const authErrorAtom = atom<string | null>(null);

export const authStatusAtom = atom((get) => ({
  hydrated: get(authHydratedAtom),
  loading: get(authLoadingAtom),
  session: get(authSessionAtom),
}));

export const clearAuthAtom = atom(null, (_get, set) => {
  set(authSessionAtom, null);
  set(authErrorAtom, null);
});

export const hydrateAuthAtom = atom(null, async (_get, set) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const session = await loadSession();
    set(authSessionAtom, session);
  } catch {
    set(authSessionAtom, null);
  } finally {
    set(authHydratedAtom, true);
    set(authLoadingAtom, false);
  }
});

export const signInAtom = atom(
  null,
  async (_get, set, payload: { email: string; password: string; rememberMe?: boolean }) => {
    set(authLoadingAtom, true);
    set(authErrorAtom, null);

    try {
      const result = await authClient.signIn.email({
        email: payload.email,
        password: payload.password,
        rememberMe: payload.rememberMe ?? true,
      });

      if (result.error) {
        throw result.error;
      }

      const data = result.data as unknown as { user: AuthUser; token: string };
      const session = await loadSession({
        user: data.user,
        token: data.token,
      });

      set(authSessionAtom, session);
      return session;
    } catch (error) {
      const message = readAuthErrorMessage(error, 'Unable to sign in');
      set(authErrorAtom, message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  },
);

export const signUpAtom = atom(
  null,
  async (_get, set, payload: { firstName: string; lastName: string; dateOfBirth: string; email: string; password: string }) => {
    set(authLoadingAtom, true);
    set(authErrorAtom, null);

    try {
      const result = await authClient.signUp.email({
        ...payload,
        name: `${payload.firstName} ${payload.lastName}`.trim(),
      });

      if (result.error) {
        throw result.error;
      }

      const data = result.data as unknown as { user: AuthUser; token: string };
      const session = await loadSession({
        user: data.user,
        token: data.token,
      });

      set(authSessionAtom, session);
      return session;
    } catch (error) {
      const message = readAuthErrorMessage(error, 'Unable to create account');
      set(authErrorAtom, message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  },
);

export const registerRecruiterAtom = atom(
  null,
  async (_get, set, payload: RecruiterOnboardingPayload) => {
    set(authLoadingAtom, true);
    set(authErrorAtom, null);

    try {
      const onboardingResult = await registerRecruiter(payload);

      const signInResult = await authClient.signIn.email({
        email: payload.recruiter.email,
        password: payload.recruiter.password,
        rememberMe: true,
      });

      if (signInResult.error) {
        throw signInResult.error;
      }

      const data = signInResult.data as unknown as { user: AuthUser; token: string };
      const session = await loadSession({
        user: data.user,
        token: data.token,
      });

      set(authSessionAtom, session);
      return {
        onboarding: onboardingResult as RecruiterOnboardingResponse,
        session,
      };
    } catch (error) {
      const message = readAuthErrorMessage(error, 'Unable to complete recruiter onboarding');
      set(authErrorAtom, message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  },
);

export const requestResetAtom = atom(null, async (_get, set, payload: { email: string; redirectTo: string }) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const result = await authClient.requestPasswordReset({
      email: payload.email,
      redirectTo: payload.redirectTo,
    });

    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    const message = readAuthErrorMessage(error, 'Unable to request a password reset');
    set(authErrorAtom, message);
    throw error;
  } finally {
    set(authLoadingAtom, false);
  }
});

export const resetPasswordAtom = atom(null, async (_get, set, payload: { token?: string; newPassword: string }) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const result = await authClient.resetPassword(payload);

    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    const message = readAuthErrorMessage(error, 'Unable to reset password');
    set(authErrorAtom, message);
    throw error;
  } finally {
    set(authLoadingAtom, false);
  }
});

export const signOutAtom = atom(null, async (_get, set) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const result = await authClient.signOut();

    if (result.error) {
      throw result.error;
    }
  } catch (error) {
    const message = readAuthErrorMessage(error, 'Unable to sign out');
    set(authErrorAtom, message);
    throw error;
  } finally {
    set(authSessionAtom, null);
    set(authLoadingAtom, false);
  }
});
