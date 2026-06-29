import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Input } from '@heroui/react';
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
          <span className="text-sm text-foreground-600">New password</span>
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="grid gap-2">
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

        {message && !loading && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
            {message}
          </div>
        )}
        {!hasToken && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
            No reset token found. <Link className="text-primary hover:underline" to="/forgot-password">Request a new link</Link>.
          </div>
        )}
        {loading && <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">Updating password...</div>}

        <Button
          type="submit"
          variant="primary"
          isDisabled={loading || !hasToken}
        >
          Update password
        </Button>
      </form>

      <div className="mt-5 text-sm text-foreground-600">
        Back to <Link className="text-primary hover:underline" to="/login">sign in</Link>
      </div>
    </AuthShell>
  );
};
