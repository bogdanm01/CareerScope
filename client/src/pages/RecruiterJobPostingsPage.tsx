import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Recruiter
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Add a job posting</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Draft a posting here. If you submit it as pending approval, the backend requires a fuller description, expiry date, and at least one skill.
          </p>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-slate-300">Title</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-slate-300">Short description</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
              value={form.shortDescription ?? ''}
              onChange={(event) => updateField('shortDescription', event.target.value)}
              maxLength={80}
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
              value={form.description ?? ''}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Expires at</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
              type="date"
              value={form.expiresAt ?? ''}
              onChange={(event) => updateField('expiresAt', event.target.value)}
            />
          </label>

          <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-300">
            New postings start as <span className="text-white">Draft</span> unless you choose to publish them for approval.
          </div>

          {(error || loading) && (
            <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100 sm:col-span-2">
              {error || 'Saving posting...'}
            </div>
          )}

          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0 sm:col-span-2"
            type="submit"
            disabled={loading}
          >
            Save draft
          </button>
          <button
            className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-500/20 disabled:cursor-progress disabled:opacity-70 sm:col-span-2"
            type="button"
            disabled={loading}
            onClick={() => void publishPosting()}
          >
            Publish for approval
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <h3 className="text-xl font-semibold text-white">Your postings</h3>
        <div className="mt-5 grid gap-4">
          {postings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
              No job postings yet.
            </div>
          ) : (
            postings.map((posting) => (
              <article key={posting.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{posting.title || 'Untitled role'}</h4>
                    <p className="mt-1 text-sm text-slate-300">{posting.shortDescription || 'No description yet.'}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    {posting.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div>
                    <span className="block text-slate-500">Company</span>
                    <span className="text-white">{posting.company?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Expires</span>
                    <span className="text-white">{posting.expiresAt ? new Date(posting.expiresAt).toLocaleDateString() : 'No expiry'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Created</span>
                    <span className="text-white">{new Date(posting.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <Link
                      className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
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
