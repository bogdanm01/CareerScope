import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { AuthShell } from '../components/AuthShell';
import { authErrorAtom, authLoadingAtom, signInAtom } from '../store/auth';

type LoginPageProps = {
  loading: boolean;
};

export const LoginPage = ({ loading }: LoginPageProps) => {
  const navigate = useNavigate();
  const signIn = useSetAtom(signInAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthError(null);

    try {
      await signIn({ email, password, rememberMe });
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to sign in';
      setError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="CareerScope"
      title="Welcome back."
      description="Sign in to continue to your dashboard and keep your application workflow moving."
      asideTitle="Existing account"
      asideText="Use the email/password credentials you created during registration."
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

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Password</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <div className="flex items-center justify-between gap-3 text-sm text-slate-300 max-sm:flex-col max-sm:items-start">
          <label className="inline-flex items-center gap-2">
            <input
              className="h-4 w-4 accent-sky-500"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <Link className="text-sky-300 hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {(error || loading) && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            {error || 'Signing you in...'}
          </div>
        )}

        <button
          className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
          type="submit"
          disabled={loading}
        >
          Sign in
        </button>
      </form>

      <div className="mt-5 text-sm text-slate-300">
        New here? <Link className="text-sky-300 hover:underline" to="/register">Create an account</Link>
      </div>
    </AuthShell>
  );
};
