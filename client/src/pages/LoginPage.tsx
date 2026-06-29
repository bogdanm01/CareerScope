import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Checkbox, Input } from '@heroui/react';
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
      const session = await signIn({ email, password, rememberMe });
      navigate(session?.user.role === 'Admin' ? '/panel/admin' : '/panel', { replace: true });
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
      asideTitle=""
      asideText=""
    >
      <form className="grid gap-5" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm text-foreground-600">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-foreground-600">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <div className="flex items-center justify-between gap-3 text-sm text-foreground-600 max-sm:flex-col max-sm:items-start">
          <Checkbox isSelected={rememberMe} onChange={setRememberMe}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              Remember me
            </Checkbox.Content>
          </Checkbox>
          <Link className="text-primary hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {(error || loading) && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
            {error || 'Signing you in...'}
          </div>
        )}

        <Button type="submit" variant="primary" isDisabled={loading} className="h-12 w-full rounded-lg">
          Sign in
        </Button>
      </form>

      <div className="mt-7 border-t border-divider pt-6 text-sm text-foreground-600">
        New here? <Link className="text-primary hover:underline" to="/register">Create a candidate account</Link>
        {' '}
        <Link className="text-primary hover:underline" to="/register/recruiter">
          or start recruiter onboarding
        </Link>
      </div>
    </AuthShell>
  );
};
