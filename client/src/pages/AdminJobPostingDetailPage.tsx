import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, TextArea } from '@heroui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  approveJobPosting,
  rejectJobPosting,
} from '../lib/admin-api';
import { getJobPostingDetail, type JobPostingDetail } from '../lib/job-postings-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const AdminJobPostingDetailPage = () => {
  const { id } = useParams();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [detail, setDetail] = useState<JobPostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [reason, setReason] = useState('');
  const [pendingAction, setPendingAction] = useState<
    | { type: 'approve' }
    | { type: 'reject'; reason: string }
    | null
  >(null);
  const [decisionHistory, setDecisionHistory] = useState<
    { status: string; reason?: string; createdAt: string }[]
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobPostingId = Number(id);

  const loadDetail = async () => {
    if (!Number.isFinite(jobPostingId)) {
      setError('Invalid job posting id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getJobPostingDetail(jobPostingId, ['skills', 'statusHistory', 'company']);
      setDetail(response.data);
    } catch (loadError) {
      setDetail(null);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job posting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [jobPostingId]);

  const handleReject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!detail || !reason.trim()) {
      return;
    }

    setPendingAction({ type: 'reject', reason: reason.trim() });
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading job posting...
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-3xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error || 'Job posting not found.'}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/admin/job-postings">
            Back to postings
          </Link>
          <Button
            type="button"
            variant="primary"
            onPress={() => void loadDetail()}
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.type === 'reject' ? 'Reject job posting?' : 'Approve job posting?'}
        description={
          pendingAction?.type === 'reject'
            ? `This will reject the posting with the reason: ${pendingAction.reason}`
            : 'This will mark the posting as active and make it visible to candidates.'
        }
        confirmLabel={pendingAction?.type === 'reject' ? 'Reject' : 'Approve'}
        confirmTone={pendingAction?.type === 'reject' ? 'danger' : 'primary'}
        loading={actioning}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!detail || !pendingAction) {
            return;
          }

          setActioning(true);
          setMessage(null);
          setError(null);
          setAuthError(null);
          setAuthLoading(true);

          try {
            if (pendingAction.type === 'approve') {
              await approveJobPosting(detail.id);
              setDetail((current) =>
                current
                  ? {
                      ...current,
                      status: 'Active',
                    }
                  : current,
              );
              setDecisionHistory((current) => [
                { status: 'Active', reason: 'Approved by admin.', createdAt: new Date().toISOString() },
                ...current,
              ]);
              setMessage('Job posting approved successfully.');
            } else {
              await rejectJobPosting(detail.id, pendingAction.reason);
              setDetail((current) =>
                current
                  ? {
                      ...current,
                      status: 'Rejected',
                    }
                  : current,
              );
              setDecisionHistory((current) => [
                { status: 'Rejected', reason: pendingAction.reason, createdAt: new Date().toISOString() },
                ...current,
              ]);
              setMessage('Job posting rejected successfully.');
            }
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to process job posting decision');
          } finally {
            setPendingAction(null);
            setActioning(false);
            setAuthLoading(false);
          }
        }}
      />

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl leading-[1.15] text-foreground">{detail.title || 'Untitled role'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review the posting and approve or reject it before it goes live.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/admin/job-postings">
              Back to postings
            </Link>
            <Button
              variant="primary"
              type="button"
              onPress={() => setPendingAction({ type: 'approve' })}
              isDisabled={actioning}
            >
              {actioning ? 'Processing...' : 'Approve posting'}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-divider bg-content1 p-4">
            <span className="block text-sm text-foreground-500">Company</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{detail.company?.name || 'Unknown company'}</strong>
          </div>
          <div className="rounded-lg border border-divider bg-content1 p-4">
            <span className="block text-sm text-foreground-500">Status</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{detail.status}</strong>
          </div>
          <div className="rounded-lg border border-divider bg-content1 p-4">
            <span className="block text-sm text-foreground-500">Expires</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">
              {detail.expiresAt ? new Date(detail.expiresAt).toLocaleDateString() : 'No expiry'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-2xl text-foreground">Posting details</h3>
          <div className="mt-5 grid gap-3 text-sm text-foreground-500">
            <div>
              <span className="block text-foreground-500">Short description</span>
              <span className="text-foreground">{detail.shortDescription || 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-foreground-500">Description</span>
              <div className="job-description-markdown mt-2 text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {detail.description || 'Not provided'}
                </ReactMarkdown>
              </div>
            </div>
            <div>
              <span className="block text-foreground-500">Required skills</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(detail.skills || []).length === 0 ? (
                  <span className="text-foreground">No skill requirements listed.</span>
                ) : (
                  detail.skills?.map((skill) => (
                    <span key={skill.id} className="rounded-md border border-divider bg-content1 px-3 py-1 text-xs text-foreground">
                      {skill.name} · {skill.yoe ?? 'Any'}y
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-2xl text-foreground">Reject posting</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-500">
            Use rejection when the posting is incomplete or not ready to go live.
          </p>

          <form className="mt-5 grid gap-4" onSubmit={handleReject}>
            <label className="grid gap-2">
              <span className="text-sm text-foreground-600">Reason</span>
              <TextArea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={3} />
            </label>

            <Button
              variant="danger"
              type="submit"
              isDisabled={actioning}
            >
              {actioning ? 'Processing...' : 'Reject posting'}
            </Button>
          </form>
        </section>
      </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-2xl text-foreground">Status history</h3>
        <div className="mt-5 grid gap-3">
          {[...(decisionHistory || []), ...(detail.statusHistory || []).map((entry) => ({
            status: entry.status,
            reason: entry.reason || undefined,
            createdAt: new Date(entry.createdAt).toISOString(),
          }))].length === 0 ? (
            <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
              No status history available.
            </div>
          ) : (
            [...decisionHistory, ...(detail.statusHistory || []).map((entry) => ({
              status: entry.status,
              reason: entry.reason || undefined,
              createdAt: new Date(entry.createdAt).toISOString(),
            }))].map((entry, index) => (
              <div key={`${entry.status}-${entry.createdAt}-${index}`} className="rounded-lg border border-divider bg-content1 p-4 text-sm text-foreground">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{entry.status}</strong>
                  <span className="text-foreground-500">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                {entry.reason && <p className="mt-2 leading-6 text-foreground-500">{entry.reason}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-2xl text-foreground">Decision history</h3>
        <div className="mt-5 grid gap-3">
          {decisionHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
              No decisions recorded yet.
            </div>
          ) : (
            decisionHistory.map((entry, index) => (
              <div key={`${entry.status}-${entry.createdAt}-${index}`} className="rounded-lg border border-divider bg-content1 p-4 text-sm text-foreground">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{entry.status}</strong>
                  <span className="text-foreground-500">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                {entry.reason && <p className="mt-2 leading-6 text-foreground-500">{entry.reason}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      {message && (
        <section className="rounded-3xl border border-success/20 bg-success/10 p-6 text-sm leading-6 text-success-700 sm:p-8">
          {message}
        </section>
      )}

      {error && (
        <section className="rounded-3xl border border-danger/20 bg-danger/10 p-6 text-sm leading-6 text-danger-700 sm:p-8">
          {error}
        </section>
      )}
    </div>
  );
};
