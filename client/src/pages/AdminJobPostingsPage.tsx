import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { approveJobPosting, getPendingJobPostings } from '../lib/admin-api';
import { type JobPostingListItem } from '../lib/job-postings-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const AdminJobPostingsPage = () => {
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [confirmPostingId, setConfirmPostingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 5;

  const loadPostings = async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPendingJobPostings({ page, limit: pageSize });
      setPostings(response.data);
      setCurrentPage(response.pagination?.currentPage ?? page);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (loadError) {
      setPostings([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pending job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPostings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (jobPostingId: number) => {
    setActioningId(jobPostingId);
    setMessage(null);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await approveJobPosting(jobPostingId);
      setMessage('Job posting approved successfully.');
      await loadPostings();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Unable to approve job posting');
    } finally {
      setActioningId(null);
      setAuthLoading(false);
    }
  };

  const requestPostingApproval = (jobPostingId: number) => {
    setConfirmPostingId(jobPostingId);
  };

  return (
    <div className="grid gap-6">
      <ConfirmDialog
        open={confirmPostingId !== null}
        title="Approve job posting?"
        description="This will mark the posting as active and make it available to candidates."
        confirmLabel="Approve"
        onCancel={() => setConfirmPostingId(null)}
        onConfirm={() => {
          if (confirmPostingId !== null) {
            setConfirmPostingId(null);
            void handleApprove(confirmPostingId);
          }
        }}
        loading={actioningId !== null}
      />

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
              Admin
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Approve job postings</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Review pending postings from recruiters and approve the ones ready to go live.
            </p>
          </div>

          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
            type="button"
            onClick={() => void loadPostings()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Pending postings</h3>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => void loadPostings(Math.max(1, currentPage - 1))}
              disabled={loading || currentPage <= 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => void loadPostings(Math.min(totalPages, currentPage + 1))}
              disabled={loading || currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            Loading pending postings...
          </div>
        ) : postings.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            No pending job postings.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {postings.map((posting) => (
              <article key={posting.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{posting.title || 'Untitled role'}</h4>
                    <p className="mt-1 text-sm text-slate-300">{posting.shortDescription || 'No short description provided.'}</p>
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
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
                    to={`/panel/admin/job-postings/${posting.id}`}
                    state={{ posting }}
                  >
                    Open detail
                  </Link>
                  <button
                    className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
                    type="button"
                    disabled={actioningId === posting.id}
                    onClick={() => requestPostingApproval(posting.id)}
                  >
                    {actioningId === posting.id ? 'Approving...' : 'Approve posting'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
