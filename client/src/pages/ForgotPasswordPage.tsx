import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { AuthShell } from '../components/AuthShell';
import { authErrorAtom, authLoadingAtom, requestResetAtom } from '../store/auth';

type ForgotPasswordPageProps = {
  loading: boolean;
};

export const ForgotPasswordPage = ({ loading }: ForgotPasswordPageProps) => {
  const requestReset = useSetAtom(requestResetAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setAuthError(null);

    try {
      await requestReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setMessage('If the email exists, a reset link has been sent.');
    } catch (submitError) {
      const errorMessage = submitError instanceof Error ? submitError.message : 'Unable to request a password reset';
      setMessage(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="CareerScope"
      title="Recover access."
      description="Request a password reset link and continue from the secure reset page."
      asideTitle="Recovery flow"
      asideText="The backend generates a reset token and logs the URL locally for development until email delivery is wired in."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Email</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        {(message || loading) && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            {message || 'Requesting reset link...'}
          </div>
        )}

        <button
          className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
          type="submit"
          disabled={loading}
        >
          Send reset link
        </button>
      </form>

      <div className="mt-5 text-sm text-slate-300">
        Remembered your password? <Link className="text-sky-300 hover:underline" to="/login">Back to sign in</Link>
      </div>
    </AuthShell>
  );
};
