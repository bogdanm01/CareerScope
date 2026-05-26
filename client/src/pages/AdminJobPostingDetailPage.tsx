import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
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
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300 backdrop-blur-xl sm:p-8">
        Loading job posting...
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">{error || 'Job posting not found.'}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white" to="/panel/admin/job-postings">
            Back to postings
          </Link>
          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            type="button"
            onClick={() => void loadDetail()}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
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

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
              Admin
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{detail.title || 'Untitled role'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Review the posting and approve or reject it before it goes live.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
              to="/panel/admin/job-postings"
            >
              Back to postings
            </Link>
            <button
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70"
              type="button"
              onClick={() => setPendingAction({ type: 'approve' })}
              disabled={actioning}
            >
              {actioning ? 'Processing...' : 'Approve posting'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Company</span>
            <strong className="mt-2 block text-sm font-medium text-white">{detail.company?.name || 'Unknown company'}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Status</span>
            <strong className="mt-2 block text-sm font-medium text-white">{detail.status}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Expires</span>
            <strong className="mt-2 block text-sm font-medium text-white">
              {detail.expiresAt ? new Date(detail.expiresAt).toLocaleDateString() : 'No expiry'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <h3 className="text-xl font-semibold text-white">Posting details</h3>
          <div className="mt-5 grid gap-3 text-sm text-slate-300">
            <div>
              <span className="block text-slate-500">Short description</span>
              <span className="text-white">{detail.shortDescription || 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Description</span>
              <span className="whitespace-pre-line text-white">{detail.description || 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Required skills</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(detail.skills || []).length === 0 ? (
                  <span className="text-white">No skill requirements listed.</span>
                ) : (
                  detail.skills?.map((skill) => (
                    <span key={skill.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {skill.name} · {skill.yoe ?? 'Any'}y
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <h3 className="text-xl font-semibold text-white">Reject posting</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use rejection when the posting is incomplete or not ready to go live.
          </p>

          <form className="mt-5 grid gap-4" onSubmit={handleReject}>
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Reason</span>
              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={3}
              />
            </label>

            <button
              className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 font-semibold text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-500/20 disabled:cursor-progress disabled:opacity-70"
              type="submit"
              disabled={actioning}
            >
              {actioning ? 'Processing...' : 'Reject posting'}
            </button>
          </form>
        </section>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <h3 className="text-xl font-semibold text-white">Status history</h3>
        <div className="mt-5 grid gap-3">
          {[...(decisionHistory || []), ...(detail.statusHistory || []).map((entry) => ({
            status: entry.status,
            reason: entry.reason || undefined,
            createdAt: new Date(entry.createdAt).toISOString(),
          }))].length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              No status history available.
            </div>
          ) : (
            [...decisionHistory, ...(detail.statusHistory || []).map((entry) => ({
              status: entry.status,
              reason: entry.reason || undefined,
              createdAt: new Date(entry.createdAt).toISOString(),
            }))].map((entry, index) => (
              <div key={`${entry.status}-${entry.createdAt}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{entry.status}</strong>
                  <span className="text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                {entry.reason && <p className="mt-2 leading-6 text-slate-300">{entry.reason}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <h3 className="text-xl font-semibold text-white">Decision history</h3>
        <div className="mt-5 grid gap-3">
          {decisionHistory.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              No decisions recorded yet.
            </div>
          ) : (
            decisionHistory.map((entry, index) => (
              <div key={`${entry.status}-${entry.createdAt}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{entry.status}</strong>
                  <span className="text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                {entry.reason && <p className="mt-2 leading-6 text-slate-300">{entry.reason}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      {message && (
        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 text-sm leading-6 text-emerald-100 backdrop-blur-xl sm:p-8">
          {message}
        </section>
      )}

      {error && (
        <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-6 text-sm leading-6 text-rose-100 backdrop-blur-xl sm:p-8">
          {error}
        </section>
      )}
    </div>
  );
};
