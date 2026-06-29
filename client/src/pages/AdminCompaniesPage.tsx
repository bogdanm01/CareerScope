import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@heroui/react';
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
    <div className="grid gap-8">
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

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-md bg-[#fcab79] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#181d26]">
              Admin
            </div>
            <h2 className="mt-4 text-4xl leading-[1.15] text-foreground">Approve companies</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review pending recruiter companies and approve the ones ready to join the platform.
            </p>
          </div>

          <Button type="button" variant="secondary" onPress={() => void loadRequests()} isDisabled={loading}>
            Refresh
          </Button>
        </div>

        {message && (
          <div className="mt-5 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm leading-6 text-success-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl text-foreground">Pending companies</h3>
          <div className="flex items-center gap-2 text-sm text-foreground-500">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadRequests(Math.max(1, currentPage - 1))}
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
              onPress={() => void loadRequests(Math.min(totalPages, currentPage + 1))}
              isDisabled={loading || currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading company approvals...
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No pending company approvals.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {requests.map((request) => (
              <article key={request.company.id} className="rounded-xl border border-divider bg-content2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">{request.company.name}</h4>
                    <p className="mt-1 text-sm text-foreground-500">
                      {request.recruiter.firstName} {request.recruiter.lastName} · {request.recruiter.email}
                    </p>
                  </div>
                  <span className="rounded-md border border-divider bg-content1 px-3 py-1 text-xs font-medium text-foreground">
                    {request.company.approvalStatus}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-foreground-500 sm:grid-cols-2">
                  <div>
                    <span className="block text-foreground-500">Tax ID</span>
                    <span className="text-foreground">{request.company.taxId}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Employees</span>
                    <span className="text-foreground">{request.company.numberOfEmployees ?? 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Website</span>
                    <span className="text-foreground">{request.company.websiteUrl || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Address</span>
                    <span className="text-foreground">{request.company.address}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-foreground-500">Description</span>
                    <span className="text-foreground">{request.company.shortDescription || 'No short description provided.'}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground"
                    to={`/panel/admin/companies/${request.company.id}`}
                    state={{ request }}
                  >
                    Open detail
                  </Link>
                  <Button
                    type="button"
                    variant="primary"
                    isDisabled={actioningId === request.company.id}
                    onPress={() => requestCompanyApproval(request.company.id)}
                  >
                    {actioningId === request.company.id ? 'Approving...' : 'Approve company'}
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
