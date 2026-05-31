import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Input, TextArea } from '@heroui/react';
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
            <span className="text-sm text-foreground-600">First name</span>
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-foreground-600">Last name</span>
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-foreground-600">Date of birth</span>
            <Input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} autoComplete="bday" required />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-foreground-600">Email</span>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-foreground-600">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-foreground-600">Confirm password</span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
        </div>

        <div className="grid gap-4 rounded-[1.75rem] border border-divider bg-content1 p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Company details</h3>
            <p className="mt-1 text-sm leading-6 text-foreground-500">
              These details will be attached to your company onboarding request.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-foreground-600">Company name</span>
              <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-foreground-600">Tax ID</span>
              <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} required />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-foreground-600">Founded year</span>
              <Input
                type="number"
                min="1800"
                max="2100"
                value={foundingYear}
                onChange={(event) => setFoundingYear(event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-foreground-600">Address</span>
              <Input value={address} onChange={(event) => setAddress(event.target.value)} required />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-foreground-600">Short description</span>
              <TextArea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                maxLength={160}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-foreground-600">Description</span>
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-foreground-600">Employees</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={numberOfEmployees}
                onChange={(event) => setNumberOfEmployees(event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-foreground-600">Website URL</span>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.com"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-foreground-600">Logo URL</span>
              <Input
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </label>
          </div>
        </div>

        {(error || loading) && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
            {error || 'Submitting your recruiter onboarding request...'}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isDisabled={loading}
        >
          Submit onboarding request
        </Button>
      </form>

      <div className="mt-5 text-sm text-foreground-600">
        Looking for a candidate account?{' '}
        <Link className="text-primary hover:underline" to="/register">
          Register as a candidate
        </Link>
      </div>
    </AuthShell>
  );
};
