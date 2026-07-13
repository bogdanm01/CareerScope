import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Input } from '@heroui/react';
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
      description="Enter your email and we’ll send instructions to reset your password."
      asideTitle="Password reset"
      asideText="We’ll send a secure reset link if the email belongs to an account."
    >
      <form className="grid gap-5" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Email <span className="text-danger">*</span></span>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>

        {(message || loading) && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
            {message || 'Requesting reset link...'}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isDisabled={loading}
          className="h-12 w-full rounded-lg"
        >
          Send reset link
        </Button>
      </form>

      <div className="mt-6 border-t border-divider pt-5 text-center text-sm text-foreground-600">
        Remembered your password? <Link className="text-primary hover:underline" to="/login">Back to sign in</Link>
      </div>
    </AuthShell>
  );
};
