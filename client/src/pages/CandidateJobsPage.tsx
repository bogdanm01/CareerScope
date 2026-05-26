import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { applyToJobPosting } from '../lib/job-applications-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';

export const CandidateJobsPage = () => {
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [jobs, setJobs] = useState<JobPostingListItem[]>([]);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await getActiveJobPostings();
        if (mounted) {
          setJobs(response.data);
        }
      } catch {
        if (mounted) {
          setJobs([]);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleApply = async (jobPostingId: number) => {
    setApplyingId(jobPostingId);
    setMessage(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await applyToJobPosting(jobPostingId);
      setMessage('Application submitted successfully.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to apply for this job';
      setMessage(errorMessage);
    } finally {
      setApplyingId(null);
      setAuthLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Candidate
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Browse job postings</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Review active openings and apply with one click when you are ready.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          {jobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
              No active jobs found.
            </div>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{job.title || 'Untitled role'}</h3>
                    <p className="mt-1 text-sm text-slate-300">{job.shortDescription || 'No description provided.'}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    {job.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div>
                    <span className="block text-slate-500">Company</span>
                    <span className="text-white">{job.company?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Expires</span>
                    <span className="text-white">{job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : 'No expiry'}</span>
                  </div>
                  <div className="flex items-end">
                    <div className="flex gap-2">
                      <Link
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
                        to={`/panel/jobs/${job.id}`}
                      >
                        View detail
                      </Link>
                      <button
                        className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
                        type="button"
                        disabled={applyingId === job.id}
                        onClick={() => void handleApply(job.id)}
                      >
                        {applyingId === job.id ? 'Applying...' : 'Apply now'}
                      </button>
                    </div>
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
