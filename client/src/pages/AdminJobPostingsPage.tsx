import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@heroui/react';
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

      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground-600">
              Admin
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Approve job postings</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review pending postings from recruiters and approve the ones ready to go live.
            </p>
          </div>

          <Button type="button" variant="secondary" onPress={() => void loadPostings()} isDisabled={loading}>
            Refresh
          </Button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm leading-6 text-success-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-foreground">Pending postings</h3>
          <div className="flex items-center gap-2 text-sm text-foreground-500">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadPostings(Math.max(1, currentPage - 1))}
              isDisabled={loading || currentPage <= 1}
            >
              Prev
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadPostings(Math.min(totalPages, currentPage + 1))}
              isDisabled={loading || currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading pending postings...
          </div>
        ) : postings.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No pending job postings.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {postings.map((posting) => (
              <article key={posting.id} className="rounded-3xl border border-divider bg-content2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{posting.title || 'Untitled role'}</h4>
                    <p className="mt-1 text-sm text-foreground-500">{posting.shortDescription || 'No short description provided.'}</p>
                  </div>
                  <span className="rounded-full border border-divider bg-content1 px-3 py-1 text-xs font-medium text-foreground">{posting.status}</span>
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
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    className="rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-content2"
                    to={`/panel/admin/job-postings/${posting.id}`}
                    state={{ posting }}
                  >
                    Open detail
                  </Link>
                  <Button
                    type="button"
                    variant="primary"
                    isDisabled={actioningId === posting.id}
                    onPress={() => requestPostingApproval(posting.id)}
                  >
                    {actioningId === posting.id ? 'Approving...' : 'Approve posting'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
