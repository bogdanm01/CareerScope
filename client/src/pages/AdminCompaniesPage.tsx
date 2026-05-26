import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveRecruiterOnboarding,
  getPendingRecruiterOnboardingRequests,
  type PendingRecruiterOnboardingRequest,
} from '../lib/admin-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const AdminCompaniesPage = () => {
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [requests, setRequests] = useState<PendingRecruiterOnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [confirmCompanyId, setConfirmCompanyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 5;

  const loadRequests = async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPendingRecruiterOnboardingRequests({ page, limit: pageSize });
      setRequests(response.data);
      setCurrentPage(response.pagination?.currentPage ?? page);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (loadError) {
      setRequests([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load company approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (companyId: number) => {
    setActioningId(companyId);
    setMessage(null);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await approveRecruiterOnboarding(companyId);
      setMessage('Company approved successfully.');
      await loadRequests();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Unable to approve company');
    } finally {
      setActioningId(null);
      setAuthLoading(false);
    }
  };

  const requestCompanyApproval = (companyId: number) => {
    setConfirmCompanyId(companyId);
  };

  return (
    <div className="grid gap-6">
      <ConfirmDialog
        open={confirmCompanyId !== null}
        title="Approve company?"
        description="This will mark the recruiter company as approved and complete the onboarding request."
        confirmLabel="Approve"
        onCancel={() => setConfirmCompanyId(null)}
        onConfirm={() => {
          if (confirmCompanyId !== null) {
            setConfirmCompanyId(null);
            void handleApprove(confirmCompanyId);
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
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Approve companies</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Review pending recruiter companies and approve the ones ready to join the platform.
            </p>
          </div>

          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
            type="button"
            onClick={() => void loadRequests()}
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
          <h3 className="text-xl font-semibold text-white">Pending companies</h3>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => void loadRequests(Math.max(1, currentPage - 1))}
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
              onClick={() => void loadRequests(Math.min(totalPages, currentPage + 1))}
              disabled={loading || currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            Loading company approvals...
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            No pending company approvals.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {requests.map((request) => (
              <article key={request.company.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{request.company.name}</h4>
                    <p className="mt-1 text-sm text-slate-300">
                      {request.recruiter.firstName} {request.recruiter.lastName} · {request.recruiter.email}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    {request.company.approvalStatus}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <span className="block text-slate-500">Tax ID</span>
                    <span className="text-white">{request.company.taxId}</span>
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
                  <div className="sm:col-span-2">
                    <span className="block text-slate-500">Description</span>
                    <span className="text-white">{request.company.shortDescription || 'No short description provided.'}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
                    to={`/panel/admin/companies/${request.company.id}`}
                    state={{ request }}
                  >
                    Open detail
                  </Link>
                  <button
                    className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
                    type="button"
                    disabled={actioningId === request.company.id}
                    onClick={() => requestCompanyApproval(request.company.id)}
                  >
                    {actioningId === request.company.id ? 'Approving...' : 'Approve company'}
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
