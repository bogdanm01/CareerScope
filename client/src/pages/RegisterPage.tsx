import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Calendar, DateField, DatePicker, Input, Label } from '@heroui/react';
import { parseDate } from '@internationalized/date';
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
      title="Create account."
      description="Set up your profile with the standard candidate registration flow."
      asideTitle=""
      asideText=""
    >
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm text-foreground-600">First name</span>
          <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-foreground-600">Last name</span>
          <Input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
        </label>

        <DatePicker
          className="sm:col-span-2"
          value={dateOfBirth ? parseDate(dateOfBirth) : null}
          onChange={(value) => setDateOfBirth(value?.toString() ?? '')}
          isRequired
          maxValue={parseDate(new Date().toISOString().slice(0, 10))}
        >
          <Label>Date of birth</Label>
          <DateField.Group fullWidth>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover>
            <Calendar>
              <Calendar.Header>
                <Calendar.NavButton slot="previous" />
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => (
                    <Calendar.Cell date={date}>
                      {({ formattedDate }) => (
                        <>
                          {formattedDate}
                          <Calendar.CellIndicator />
                        </>
                      )}
                    </Calendar.Cell>
                  )}
                </Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {({ year }) => <Calendar.YearPickerCell year={year} />}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>

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
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700 sm:col-span-2">
            {error || 'Creating your account...'}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isDisabled={loading}
          className="h-12 w-full rounded-lg sm:col-span-2"
        >
          Create account
        </Button>
      </form>

      <div className="mt-7 border-t border-divider pt-6 text-sm text-foreground-600">
        Already have an account? <Link className="text-primary hover:underline" to="/login">Sign in</Link>
        <br />
        Are you a recruiter?{' '}
        <Link className="text-primary hover:underline" to="/register/recruiter">
          Complete recruiter onboarding
        </Link>
      </div>
    </AuthShell>
  );
};
