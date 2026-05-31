import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Input } from '@heroui/react';
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
      const session = await signUp({
        firstName,
        lastName,
        dateOfBirth,
        email,
        password,
      });
      navigate(session?.user.role === 'Admin' ? '/panel/admin' : '/panel', { replace: true });
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
      title="Create your candidate account."
      description="Set up your profile with the standard candidate registration flow."
      asideTitle="Candidate registration"
      asideText="Candidates use the regular Better Auth sign-up flow with first name, last name, date of birth, email and password."
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
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

        {(error || loading) && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700 sm:col-span-2">
            {error || 'Creating your account...'}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isDisabled={loading}
          className="sm:col-span-2"
        >
          Create account
        </Button>
      </form>

      <div className="mt-5 text-sm text-foreground-600">
        Already have an account? <Link className="text-primary hover:underline" to="/login">Sign in</Link>
      </div>

      <div className="mt-3 text-sm text-foreground-600">
        Are you a recruiter?{' '}
        <Link className="text-primary hover:underline" to="/register/recruiter">
          Complete recruiter onboarding
        </Link>
      </div>
    </AuthShell>
  );
};
