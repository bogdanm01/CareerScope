import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, TextArea } from '@heroui/react';
import { useSetAtom } from 'jotai';
import { createJobPosting, type JobPostingCreatePayload } from '../lib/job-postings-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';

type RecruiterJobPostingCreatePageProps = {
  loading: boolean;
};

const emptyForm: JobPostingCreatePayload = {
  title: '',
  shortDescription: '',
  description: '',
  status: 'Draft',
  expiresAt: '',
  skills: [],
};

export const RecruiterJobPostingCreatePage = ({ loading }: RecruiterJobPostingCreatePageProps) => {
  const navigate = useNavigate();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [form, setForm] = useState<JobPostingCreatePayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof JobPostingCreatePayload>(key: K, value: JobPostingCreatePayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitPosting = async (status: JobPostingCreatePayload['status']) => {
    const payload = {
      ...form,
      status,
      shortDescription: form.shortDescription?.trim() || undefined,
      description: form.description?.trim() || undefined,
      expiresAt: form.expiresAt || undefined,
    };

    const response = await createJobPosting(payload);
    navigate(`/panel/job-postings/${response.data.id}`);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await submitPosting('Draft');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create job posting');
    } finally {
      setAuthLoading(false);
    }
  };

  const publishPosting = async () => {
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await submitPosting('PendingApproval');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to publish job posting');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl leading-[1.15] text-foreground">Add a job posting</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Draft a posting here. If you submit it as pending approval, the backend requires a fuller description, expiry date, and at least one skill.
          </p>
        </div>
        <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/job-postings">
          Back to postings
        </Link>
      </div>

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm text-foreground-600">Title</span>
          <Input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
        </label>

        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm text-foreground-600">Short description</span>
          <Input value={form.shortDescription ?? ''} onChange={(event) => updateField('shortDescription', event.target.value)} maxLength={80} />
        </label>

        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm text-foreground-600">Description</span>
          <TextArea value={form.description ?? ''} onChange={(event) => updateField('description', event.target.value)} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-foreground-600">Expires at</span>
          <Input type="date" value={form.expiresAt ?? ''} onChange={(event) => updateField('expiresAt', event.target.value)} />
        </label>

        <div className="rounded-lg border border-divider bg-content2 px-4 py-3 text-sm leading-6 text-foreground-500 sm:col-span-2">
          New postings start as <span className="font-medium text-foreground">Draft</span> unless you choose to publish them for approval.
        </div>

        {(error || loading) && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700 sm:col-span-2">
            {error || 'Saving posting...'}
          </div>
        )}

        <Button type="submit" variant="primary" isDisabled={loading} className="sm:col-span-2">
          Save draft
        </Button>
        <Button
          type="button"
          variant="secondary"
          isDisabled={loading}
          onPress={() => void publishPosting()}
          className="sm:col-span-2"
        >
          Publish for approval
        </Button>
      </form>
    </section>
  );
};
