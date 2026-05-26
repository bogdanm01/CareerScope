import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { AuthShell } from '../components/AuthShell';
import { authErrorAtom, authLoadingAtom, registerRecruiterAtom } from '../store/auth';

type RecruiterOnboardingPageProps = {
  loading: boolean;
};

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalText = (value: string) => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

export const RecruiterOnboardingPage = ({ loading }: RecruiterOnboardingPageProps) => {
  const navigate = useNavigate();
  const registerRecruiter = useSetAtom(registerRecruiterAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [foundingYear, setFoundingYear] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
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
      const session = await registerRecruiter({
        recruiter: {
          firstName,
          lastName,
          dateOfBirth,
          email,
          password,
        },
        company: {
          name: companyName,
          taxId,
          address,
          shortDescription: parseOptionalText(shortDescription),
          description: parseOptionalText(description),
          foundingYear: parseOptionalNumber(foundingYear),
          numberOfEmployees: parseOptionalNumber(numberOfEmployees),
          logoUrl: parseOptionalText(logoUrl),
          websiteUrl: parseOptionalText(websiteUrl),
        },
      });

      navigate(session.session?.user.role === 'Admin' ? '/panel/admin' : '/panel', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to complete recruiter onboarding';
      setError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Recruiter onboarding"
      title="Create your recruiter profile."
      description="Register your recruiter account and submit the company details needed for onboarding."
      asideTitle="Company onboarding"
      asideText="Recruiters submit company information together with their account. The backend creates the user and queues the company for approval."
    >
      <form className="grid gap-6" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Company details</h3>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              These details will be attached to your company onboarding request.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-slate-300">Company name</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Tax ID</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Founded year</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                type="number"
                min="1800"
                max="2100"
                value={foundingYear}
                onChange={(event) => setFoundingYear(event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-slate-300">Address</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-slate-300">Short description</span>
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                maxLength={160}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-slate-300">Description</span>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Employees</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                type="number"
                min="1"
                step="1"
                value={numberOfEmployees}
                onChange={(event) => setNumberOfEmployees(event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Website URL</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.com"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-slate-300">Logo URL</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </label>
          </div>
        </div>

        {(error || loading) && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            {error || 'Submitting your recruiter onboarding request...'}
          </div>
        )}

        <button
          className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
          type="submit"
          disabled={loading}
        >
          Submit onboarding request
        </button>
      </form>

      <div className="mt-5 text-sm text-slate-300">
        Looking for a candidate account?{' '}
        <Link className="text-sky-300 hover:underline" to="/register">
          Register as a candidate
        </Link>
      </div>
    </AuthShell>
  );
};
