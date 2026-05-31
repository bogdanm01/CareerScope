import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, TextArea } from '@heroui/react';
import { createJobPosting, getRecruiterJobPostings, type JobPostingCreatePayload, type JobPostingListItem } from '../lib/job-postings-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';

type RecruiterJobPostingsPageProps = {
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

export const RecruiterJobPostingsPage = ({ loading }: RecruiterJobPostingsPageProps) => {
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [form, setForm] = useState<JobPostingCreatePayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const loadPostings = async () => {
    try {
      const response = await getRecruiterJobPostings();
      setPostings(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job postings');
    }
  };

  useEffect(() => {
    void loadPostings();
  }, []);

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

    await createJobPosting(payload);
    setForm(emptyForm);
    await loadPostings();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await submitPosting('Draft');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to create job posting';
      setError(message);
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
      const message = submitError instanceof Error ? submitError.message : 'Unable to publish job posting';
      setError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground-600">
            Recruiter
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Add a job posting</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Draft a posting here. If you submit it as pending approval, the backend requires a fuller description, expiry date, and at least one skill.
          </p>
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

          <div className="sm:col-span-2 rounded-3xl border border-divider bg-content2 px-4 py-3 text-sm leading-6 text-foreground-500">
            New postings start as <span className="text-white">Draft</span> unless you choose to publish them for approval.
          </div>

          {(error || loading) && (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700 sm:col-span-2">
              {error || 'Saving posting...'}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading}
            className="sm:col-span-2"
          >
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

      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-foreground">Your postings</h3>
        <div className="mt-5 grid gap-4">
          {postings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
              No job postings yet.
            </div>
          ) : (
            postings.map((posting) => (
              <article key={posting.id} className="rounded-3xl border border-divider bg-content2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{posting.title || 'Untitled role'}</h4>
                    <p className="mt-1 text-sm text-foreground-500">{posting.shortDescription || 'No description yet.'}</p>
                  </div>
                  <span className="rounded-full border border-divider bg-content1 px-3 py-1 text-xs font-medium text-foreground">
                    {posting.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-foreground-500 sm:grid-cols-3">
                  <div>
                    <span className="block text-foreground-500">Company</span>
                    <span className="text-foreground">{posting.company?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Expires</span>
                    <span className="text-foreground">{posting.expiresAt ? new Date(posting.expiresAt).toLocaleDateString() : 'No expiry'}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Created</span>
                    <span className="text-foreground">{new Date(posting.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <Link
                      className="inline-flex rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-content2"
                      to={`/panel/job-postings/${posting.id}`}
                    >
                      Open detail
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
