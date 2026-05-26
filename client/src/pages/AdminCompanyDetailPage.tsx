import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import {
  approveRecruiterOnboarding,
  getPendingRecruiterOnboardingRequests,
  rejectRecruiterOnboarding,
  type ApprovedRecruiterOnboardingRequest,
  type PendingRecruiterOnboardingRequest,
  type RejectedRecruiterOnboardingRequest,
} from '../lib/admin-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';

type CompanyDetailRequest = PendingRecruiterOnboardingRequest & {
  company: PendingRecruiterOnboardingRequest['company'] & {
    isApproved?: boolean;
    approvedAt?: string | null;
    approvalRejectionReason?: string | null;
  };
};

type CompanyDecision = {
  action: 'Approved' | 'Rejected';
  at: string;
  reason?: string;
};

type AdminCompanyLocationState = {
  request?: CompanyDetailRequest;
};

type PendingAction =
  | {
      type: 'approve';
    }
  | {
      type: 'reject';
      reason: string;
    }
  | null;

export const AdminCompanyDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [request, setRequest] = useState<CompanyDetailRequest | null>(
    (location.state as AdminCompanyLocationState | null)?.request ?? null,
  );
  const [decisionHistory, setDecisionHistory] = useState<CompanyDecision[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(!request);
  const [actioning, setActioning] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const companyId = Number(id);

  const loadRequest = async () => {
    if (!Number.isFinite(companyId)) {
      setError('Invalid company id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPendingRecruiterOnboardingRequests({ page: 1, limit: 100 });
      const found = response.data.find((entry) => entry.company.id === companyId) || null;
      setRequest(found);

      if (!found) {
        setError('No pending company approval found for this id.');
      }
    } catch (loadError) {
      setRequest(null);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load company approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (request) {
      setLoading(false);
      return;
    }

    void loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const applyDecision = (decision: CompanyDecision, updatedRequest?: CompanyDetailRequest | null) => {
    setDecisionHistory((current) => [decision, ...current]);
    if (updatedRequest !== undefined) {
      setRequest(updatedRequest);
    }
  };

  const handleConfirm = async () => {
    if (!request || !pendingAction) {
      return;
    }

    setActioning(true);
    setError(null);
    setMessage(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (pendingAction.type === 'approve') {
        const response = await approveRecruiterOnboarding(request.company.id);
        const approved = response.data as ApprovedRecruiterOnboardingRequest;
        applyDecision(
          {
            action: 'Approved',
            at: new Date().toISOString(),
          },
          {
            ...request,
            company: {
              ...request.company,
              isApproved: approved.company.isApproved,
              approvalStatus: approved.company.approvalStatus,
              approvedAt: approved.company.approvedAt,
              approvalRejectionReason: null,
            },
          },
        );
        setMessage('Company approved successfully.');
      } else {
        const response = await rejectRecruiterOnboarding(request.company.id, pendingAction.reason);
        const rejected = response.data as RejectedRecruiterOnboardingRequest;
        applyDecision(
          {
            action: 'Rejected',
            at: new Date().toISOString(),
            reason: pendingAction.reason,
          },
          {
            ...request,
            company: {
              ...request.company,
              isApproved: rejected.company.isApproved,
              approvalStatus: rejected.company.approvalStatus,
              approvalRejectionReason: rejected.company.approvalRejectionReason,
            },
          },
        );
        setMessage('Company rejected successfully.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to process company approval');
    } finally {
      setPendingAction(null);
      setActioning(false);
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300 backdrop-blur-xl sm:p-8">
        Loading company approval...
      </section>
    );
  }

  if (!request) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
          {error || 'Company approval not found.'}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white" to="/panel/admin/companies">
            Back to companies
          </Link>
          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            type="button"
            onClick={() => void loadRequest()}
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
        title={pendingAction?.type === 'reject' ? 'Reject company?' : 'Approve company?'}
        description={
          pendingAction?.type === 'reject'
            ? `This will reject the company with the reason: ${pendingAction.reason}`
            : 'This will mark the company as approved and complete the recruiter onboarding request.'
        }
        confirmLabel={pendingAction?.type === 'reject' ? 'Reject' : 'Approve'}
        confirmTone={pendingAction?.type === 'reject' ? 'danger' : 'primary'}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void handleConfirm()}
        loading={actioning}
      />

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
              Admin
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{request.company.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Review the company and recruiter details before approving or rejecting the onboarding request.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
              to="/panel/admin/companies"
            >
              Back to companies
            </Link>
            <button
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70"
              type="button"
              onClick={() => setPendingAction({ type: 'approve' })}
              disabled={actioning}
            >
              Approve company
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Recruiter</span>
            <strong className="mt-2 block text-sm font-medium text-white">
              {request.recruiter.firstName} {request.recruiter.lastName}
            </strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Email</span>
            <strong className="mt-2 block text-sm font-medium text-white">{request.recruiter.email}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Status</span>
            <strong className="mt-2 block text-sm font-medium text-white">{request.company.approvalStatus}</strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <h3 className="text-xl font-semibold text-white">Company details</h3>
          <div className="mt-5 grid gap-3 text-sm text-slate-300">
            <div>
              <span className="block text-slate-500">Tax ID</span>
              <span className="text-white">{request.company.taxId}</span>
            </div>
            <div>
              <span className="block text-slate-500">Founded year</span>
              <span className="text-white">{request.company.foundingYear ?? 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Employees</span>
              <span className="text-white">{request.company.numberOfEmployees ?? 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Website</span>
              <span className="text-white">{request.company.websiteUrl || 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Address</span>
              <span className="text-white">{request.company.address}</span>
            </div>
            <div>
              <span className="block text-slate-500">Short description</span>
              <span className="text-white">{request.company.shortDescription || 'Not provided'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Description</span>
              <span className="text-white">{request.company.description || 'Not provided'}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <h3 className="text-xl font-semibold text-white">Reject request</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use rejection when the company details are incomplete or do not meet approval rules.
          </p>

          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reason.trim()) {
                return;
              }
              setPendingAction({ type: 'reject', reason: reason.trim() });
            }}
          >
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
              Reject company
            </button>
          </form>
        </section>
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
              <div key={`${entry.action}-${entry.at}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{entry.action}</strong>
                  <span className="text-slate-400">{new Date(entry.at).toLocaleString()}</span>
                </div>
                {entry.reason && <p className="mt-2 leading-6 text-slate-300">{entry.reason}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      {request.company.approvalStatus === 'Rejected' && request.company.approvalRejectionReason && (
        <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-6 text-sm leading-6 text-rose-100 backdrop-blur-xl sm:p-8">
          <strong className="block">Latest rejection reason</strong>
          <p className="mt-2">{request.company.approvalRejectionReason}</p>
        </section>
      )}

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
