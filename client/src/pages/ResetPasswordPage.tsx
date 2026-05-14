import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { AuthShell } from '../components/AuthShell';
import { authErrorAtom, authLoadingAtom, resetPasswordAtom } from '../store/auth';

type ResetPasswordPageProps = {
  loading: boolean;
};

export const ResetPasswordPage = ({ loading }: ResetPasswordPageProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? undefined;
  const resetPassword = useSetAtom(resetPasswordAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const hasToken = Boolean(token);
  const headline = useMemo(
    () => (hasToken ? 'Choose a new password.' : 'Open the link from your email.'),
    [hasToken],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setAuthError(null);

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (!token) {
      setMessage('Missing reset token. Use the link from your password reset email.');
      return;
    }

    try {
      await resetPassword({
        token,
        newPassword,
      });
      setMessage('Password updated. Redirecting to sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (submitError) {
      const errorMessage = submitError instanceof Error ? submitError.message : 'Unable to reset password';
      setMessage(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="CareerScope"
      title={headline}
      description="Use the token from your reset link to set a new password."
      asideTitle="Reset link"
      asideText="The reset token is validated on the backend before the password change is accepted."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">New password</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Confirm password</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {message && !loading && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            {message}
          </div>
        )}
        {!hasToken && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            No reset token found. <Link className="text-sky-300 hover:underline" to="/forgot-password">Request a new link</Link>.
          </div>
        )}
        {loading && <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">Updating password...</div>}

        <button
          className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
          type="submit"
          disabled={loading || !hasToken}
        >
          Update password
        </button>
      </form>

      <div className="mt-5 text-sm text-slate-300">
        Back to <Link className="text-sky-300 hover:underline" to="/login">sign in</Link>
      </div>
    </AuthShell>
  );
};
