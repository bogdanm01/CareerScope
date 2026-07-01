import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Avatar, Button, Chip, TextArea, toast } from '@heroui/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  approveRecruiterOnboarding,
  getAdminCompany,
  rejectRecruiterOnboarding,
  type AdminCompanyListItem,
} from '../lib/admin-api';
import { getApiBaseUrl } from '../lib/http';
import { ConfirmDialog } from '../components/ConfirmDialog';

const formatApprovalStatus = (status: string) => {
  switch (status) {
    case 'PendingApproval':
      return 'Pending approval';
    default:
      return status;
  }
};

const getApprovalColor = (status: string): 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'PendingApproval':
      return 'warning';
    default:
      return 'default';
  }
};

const formatDotDate = (value: string | null | undefined, fallback = 'Not provided') => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(/\//g, '.');
};

const resolveAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  const baseUrl = getApiBaseUrl();
  return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${assetUrl}` : new URL(assetUrl, baseUrl).toString();
};

export const AdminCompanyProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const companyId = Number(id);
  const locationState = location.state as { company?: AdminCompanyListItem; backTo?: string } | null;
  const initialCompany = locationState?.company ?? null;
  const backTo = locationState?.backTo?.startsWith('/') ? locationState.backTo : '/panel/admin/companies';
  const [company, setCompany] = useState<AdminCompanyListItem | null>(initialCompany);
  const [loading, setLoading] = useState(!initialCompany);
  const [error, setError] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actioning, setActioning] = useState(false);
  const logoUrl = useMemo(() => resolveAssetUrl(company?.logoUrl), [company?.logoUrl]);
  const canReviewCompany = company?.approvalStatus === 'PendingApproval' && !company.isDeleted;

  const loadCompany = async () => {
    if (!Number.isFinite(companyId)) {
      setError('Invalid company id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAdminCompany(companyId);
      setCompany(response.data);
    } catch (loadError) {
      setCompany(null);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const approveCompany = async () => {
    if (!company) {
      return;
    }

    setActioning(true);
    setError(null);

    try {
      await approveRecruiterOnboarding(company.id);
      toast.success('Company approved successfully.');
      setApprovalDialogOpen(false);
      await loadCompany();
    } catch (approveError) {
      const message = approveError instanceof Error ? approveError.message : 'Unable to approve company';
      setError(message);
      toast.danger('Unable to approve company', { description: message });
    } finally {
      setActioning(false);
    }
  };

  const rejectCompany = async () => {
    if (!company) {
      return;
    }

    const reason = rejectionReason.trim();
    if (reason.length < 3) {
      toast.danger('Rejection reason is required', {
        description: 'Add a clear reason before rejecting this company.',
      });
      return;
    }

    setActioning(true);
    setError(null);

    try {
      await rejectRecruiterOnboarding(company.id, reason);
      toast.success('Company rejected successfully.');
      setRejectDialogOpen(false);
      setRejectionReason('');
      await loadCompany();
    } catch (rejectError) {
      const message = rejectError instanceof Error ? rejectError.message : 'Unable to reject company';
      setError(message);
      toast.danger('Unable to reject company', { description: message });
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading company...
      </section>
    );
  }

  if (!company) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">
          {error || 'Company not found.'}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onPress={() => void loadCompany()}>
            Retry
          </Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to={backTo}>
            Back
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <ConfirmDialog
        open={approvalDialogOpen}
        title="Approve company?"
        description="This will approve the company and complete the recruiter onboarding request."
        confirmLabel="Approve"
        loading={actioning}
        onCancel={() => setApprovalDialogOpen(false)}
        onConfirm={() => void approveCompany()}
      />

      {rejectDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button
              aria-label="Close rejection reason dialog"
              className="absolute inset-0 bg-black/40"
              type="button"
              disabled={actioning}
              onClick={() => setRejectDialogOpen(false)}
            />
            <div
              aria-modal="true"
              role="dialog"
              className="relative z-10 w-full max-w-lg rounded-xl border border-divider bg-content1 p-6 shadow-2xl outline-none"
            >
              <h2 className="text-2xl text-foreground">Reject company?</h2>
              <p className="mt-3 text-sm leading-6 text-foreground-500">
                Add a rejection reason. The backend stores this reason on the company record.
              </p>

              <label className="mt-5 grid gap-2 text-sm font-medium text-foreground">
                Rejection reason
                <TextArea
                  minLength={3}
                  placeholder="Explain why this company is being rejected."
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
              </label>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="outline"
                  isDisabled={actioning}
                  onPress={() => setRejectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="danger"
                  isDisabled={actioning || rejectionReason.trim().length < 3}
                  onPress={() => void rejectCompany()}
                >
                  {actioning ? 'Rejecting...' : 'Reject company'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link className="inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground-500 hover:text-foreground" to={backTo}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back
            </Link>
            <div className="mt-6 flex min-w-0 items-center gap-5">
              <Avatar className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e3d3b8] !bg-[#f5e9d4] !text-[#181d26]">
                {logoUrl && (
                  <Avatar.Image alt={`${company.name} logo`} className="h-full w-full bg-white object-contain p-2" src={logoUrl} />
                )}
                <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-[#f5e9d4] text-lg font-semibold !text-[#181d26]" delayMs={0}>
                  {company.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </Avatar.Fallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip className="rounded-md" color={getApprovalColor(company.approvalStatus)} size="sm" variant="soft">
                    {formatApprovalStatus(company.approvalStatus)}
                  </Chip>
                  {company.isDeleted && (
                    <Chip className="rounded-md" color="danger" size="sm" variant="soft">
                      Deleted
                    </Chip>
                  )}
                </div>
                <h2 className="mt-3 text-4xl leading-[1.15] text-foreground">{company.name}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-500">
                  {company.shortDescription || 'No company summary provided.'}
                </p>
              </div>
            </div>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground"
            to={`/companies/${company.id}?backTo=${encodeURIComponent(`/panel/admin/companies/${company.id}`)}`}
          >
            <ExternalLink className="h-4 w-4" />
            Public page
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-2xl text-foreground">Company details</h3>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground-500">ID</dt>
              <dd className="mt-1 font-medium text-foreground">#{company.id}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Tax ID</dt>
              <dd className="mt-1 font-medium text-foreground">{company.taxId}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Employees</dt>
              <dd className="mt-1 font-medium text-foreground">{company.numberOfEmployees ?? 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Founding year</dt>
              <dd className="mt-1 font-medium text-foreground">{company.foundingYear ?? 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Approved at</dt>
              <dd className="mt-1 font-medium text-foreground">{formatDotDate(company.approvedAt)}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Website</dt>
              <dd className="mt-1 font-medium text-foreground">{company.websiteUrl || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-foreground-500">Address</dt>
              <dd className="mt-1 font-medium text-foreground">{company.address || 'Not provided'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-2xl text-foreground">Approval state</h3>
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-foreground-500">Status</dt>
              <dd className="mt-1 font-medium text-foreground">{formatApprovalStatus(company.approvalStatus)}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Approved</dt>
              <dd className="mt-1 font-medium text-foreground">{company.isApproved ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Deleted</dt>
              <dd className="mt-1 font-medium text-foreground">{company.isDeleted ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-foreground-500">Rejection reason</dt>
              <dd className="mt-1 font-medium text-foreground">{company.approvalRejectionReason || 'Not provided'}</dd>
            </div>
          </dl>

          {canReviewCompany && (
            <div className="mt-6 rounded-xl border border-divider bg-content2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-base font-medium text-foreground">Review actions</h4>
                  <p className="mt-1 text-sm leading-6 text-foreground-500">
                    Approve this company or reject it with a stored reason.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    className="rounded-lg"
                    type="button"
                    variant="primary"
                    size="sm"
                    isDisabled={actioning}
                    onPress={() => setApprovalDialogOpen(true)}
                  >
                    Approve
                  </Button>
                  <Button
                    className="rounded-lg"
                    type="button"
                    variant="danger"
                    size="sm"
                    isDisabled={actioning}
                    onPress={() => setRejectDialogOpen(true)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-2xl text-foreground">Description</h3>
        <div className="job-description-markdown mt-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {company.description || 'No company description provided.'}
          </ReactMarkdown>
        </div>
      </section>
    </div>
  );
};
