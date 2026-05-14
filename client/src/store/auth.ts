import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { getSession, requestPasswordReset, resetPassword, signIn, signOut, signUp, type AuthSession } from '../lib/auth-api';

const authStorage = createJSONStorage<string | null>(() => localStorage);

export const authTokenAtom = atomWithStorage<string | null>('career-scope.auth.token', null, authStorage);
export const authSessionAtom = atom<AuthSession | null>(null);
export const authHydratedAtom = atom(false);
export const authLoadingAtom = atom(false);
export const authErrorAtom = atom<string | null>(null);

export const authStatusAtom = atom((get) => ({
  hydrated: get(authHydratedAtom),
  loading: get(authLoadingAtom),
  session: get(authSessionAtom),
  token: get(authTokenAtom),
}));

export const clearAuthAtom = atom(null, (_get, set) => {
  set(authTokenAtom, null);
  set(authSessionAtom, null);
  set(authErrorAtom, null);
});

export const hydrateAuthAtom = atom(null, async (_get, set) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const session = await getSession();
    set(authSessionAtom, session);
    set(authTokenAtom, session?.session.token ?? null);
  } catch {
    set(authSessionAtom, null);
    set(authTokenAtom, null);
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
      const result = await signIn(payload);
      set(authTokenAtom, result.token);

      const session = await getSession();
      if (session) {
        set(authSessionAtom, session);
        return session;
      }

      const fallbackSession: AuthSession = {
        session: {
          token: result.token,
          userId: result.user.id,
        },
        user: result.user,
      };

      set(authSessionAtom, fallbackSession);
      return fallbackSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
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
      const result = await signUp({
        ...payload,
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        rememberMe: true,
      });

      if (result.token) {
        set(authTokenAtom, result.token);
      }

      const session = await getSession();
      if (session) {
        set(authSessionAtom, session);
        return session;
      }

      const fallbackSession: AuthSession = {
        session: {
          token: result.token ?? undefined,
          userId: result.user.id,
        },
        user: result.user,
      };

      set(authSessionAtom, fallbackSession);
      return fallbackSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account';
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
    return await requestPasswordReset(payload.email, payload.redirectTo);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to request a password reset';
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
    return await resetPassword(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset password';
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
    await signOut();
  } finally {
    set(authTokenAtom, null);
    set(authSessionAtom, null);
    set(authLoadingAtom, false);
  }
});
