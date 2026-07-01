import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Calendar, DateField, DatePicker, Input, TextArea } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { RichTextEditor } from '../components/RichTextEditor';
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
          websiteUrl: parseOptionalText(websiteUrl),
        },
        logoFile,
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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8 lg:py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="text-xl font-semibold tracking-[-0.03em] text-foreground" to="/login">
            CareerScope
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link className="font-medium text-foreground-600 hover:text-foreground" to="/register">
              Candidate registration
            </Link>
            <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 font-medium text-foreground" to="/login">
              Back to sign in
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-medium tracking-[-0.06em] text-foreground sm:text-5xl">
              Create your recruiter account.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-500">
              Set up your account and company profile in one step. After submission, the company profile is sent for approval before postings can go live.
            </p>
          </div>
        </section>

        <form className="grid gap-6" onSubmit={onSubmit}>
          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-medium tracking-[-0.04em] text-foreground">Recruiter account</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-500">
                  Use your work email and personal details for the recruiter login.
                </p>
              </div>
              <span className="w-fit rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-medium text-foreground-500">
                Required
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">First name <span className="text-danger">*</span></span>
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Last name <span className="text-danger">*</span></span>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Date of birth <span className="text-danger">*</span>
                </span>
                <DatePicker
                  className="w-full"
                  aria-label="Date of birth"
                  value={dateOfBirth ? parseDate(dateOfBirth) : null}
                  onChange={(value) => setDateOfBirth(value?.toString() ?? '')}
                  isRequired
                  maxValue={parseDate(new Date().toISOString().slice(0, 10))}
                >
                  <DateField.Group fullWidth className="min-h-[42px]">
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <DatePicker.Popover className="!w-[340px] !min-w-[340px] max-w-[calc(100vw-2rem)]">
                    <Calendar className="!w-[340px] max-w-full">
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
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Email <span className="text-danger">*</span></span>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Password <span className="text-danger">*</span></span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Confirm password <span className="text-danger">*</span></span>
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
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.04em] text-foreground">Company profile</h2>
              <p className="mt-1 text-sm leading-6 text-foreground-500">
                This information is shown on company pages and attached to your onboarding request.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Company name <span className="text-danger">*</span></span>
                <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Tax ID <span className="text-danger">*</span></span>
                <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} required />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Founded year</span>
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
                <span className="text-sm font-medium text-foreground">Address <span className="text-danger">*</span></span>
                <Input value={address} onChange={(event) => setAddress(event.target.value)} required />
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Short description</span>
                <TextArea
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  maxLength={160}
                  placeholder="Optional"
                />
              </label>

              <div className="grid gap-3 sm:col-span-2">
                <div>
                  <span className="text-sm font-medium text-foreground">Description</span>
                  <p className="mt-1 text-xs leading-5 text-foreground-500">
                    Add a formatted company overview for candidates and admins.
                  </p>
                </div>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the company, culture, and work environment."
                />
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Employees</span>
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
                <span className="text-sm font-medium text-foreground">Website URL</span>
                <Input
                  type="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://example.com"
                />
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Company logo</span>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                />
                <span className="text-xs leading-5 text-foreground-500">Upload a JPG, PNG, WebP, or SVG image up to 2 MB.</span>
              </label>
            </div>
          </section>

          {(error || loading) && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
              {error || 'Submitting your recruiter onboarding request...'}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="outline" className="h-11 rounded-lg px-6" onPress={() => navigate('/login')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isDisabled={loading} className="h-11 rounded-lg px-6">
              Submit onboarding request
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};
