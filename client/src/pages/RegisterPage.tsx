import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { AuthShell } from '../components/AuthShell';
import { authErrorAtom, authLoadingAtom, signUpAtom } from '../store/auth';

type RegisterPageProps = {
  loading: boolean;
};

export const RegisterPage = ({ loading }: RegisterPageProps) => {
  const navigate = useNavigate();
  const signUp = useSetAtom(signUpAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await signUp({
        firstName,
        lastName,
        dateOfBirth,
        email,
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to create account';
      setError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="CareerScope"
      title="Create your account."
      description="Set up your profile and start with a clean session-backed login."
      asideTitle="Candidate profile"
      asideText="Registration collects the fields required by the backend schema: name, date of birth, email and password."
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">First name</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Last name</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </label>

        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm text-slate-300">Date of birth</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            autoComplete="bday"
            required
          />
        </label>

        <label className="grid gap-2 sm:col-span-2">
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

        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm text-slate-300">Password</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="grid gap-2 sm:col-span-2">
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

        {(error || loading) && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100 sm:col-span-2">
            {error || 'Creating your account...'}
          </div>
        )}

        <button
          className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0 sm:col-span-2"
          type="submit"
          disabled={loading}
        >
          Create account
        </button>
      </form>

      <div className="mt-5 text-sm text-slate-300">
        Already have an account? <Link className="text-sky-300 hover:underline" to="/login">Sign in</Link>
      </div>
    </AuthShell>
  );
};
