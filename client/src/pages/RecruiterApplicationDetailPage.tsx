import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { Button, Chip, TextArea, toast } from '@heroui/react';
import {
  downloadJobApplicationCandidateCv,
  getJobApplicationDetail,
  updateJobApplication,
  type JobApplicationDetail,
  type JobApplicationReviewStatus,
} from '../lib/job-applications-api';
import { formatDateTime } from '../lib/date-format';

const getReviewActions = (status?: string): { status: JobApplicationReviewStatus; label: string }[] => {
  if (status === 'Submitted') {
    return [
      { status: 'UnderReview', label: 'Mark under review' },
      { status: 'Rejected', label: 'Reject' },
    ];
  }

  if (status === 'UnderReview') {
    return [
      { status: 'Accepted', label: 'Accept' },
      { status: 'Rejected', label: 'Reject' },
    ];
  }

  return [];
};

const getReviewActionClassName = (status: JobApplicationReviewStatus, isSelected: boolean) => {
  if (status === 'Accepted') {
    return isSelected
      ? 'w-full justify-center rounded-lg border border-[#0f6b3a] bg-[#0f6b3a] text-white'
      : 'w-full justify-center rounded-lg border border-[#a8d8c4] bg-[#e8f5ef] text-[#0f6b3a]';
  }

  if (status === 'Rejected') {
    return isSelected
      ? 'w-full justify-center rounded-lg border border-[#b42318] bg-[#b42318] text-white'
      : 'w-full justify-center rounded-lg border border-[#f3b8b2] bg-[#fdebea] text-[#b42318]';
  }

  return isSelected
    ? 'w-full justify-center rounded-lg bg-[#181d26] text-white'
    : 'w-full justify-center rounded-lg';
};

const formatStatus = (status?: string) => {
  if (!status) {
    return 'Unknown';
  }

  return status === 'UnderReview' ? 'Under Review' : status;
};

const getStatusColor = (status?: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'UnderReview':
      return 'warning';
    case 'Submitted':
      return 'accent';
    default:
      return 'default';
  }
};

export const RecruiterApplicationDetailPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState<JobApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<JobApplicationReviewStatus | null>(null);
  const [reason, setReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const applicationId = Number(id);

  const loadDetail = async () => {
    if (!Number.isFinite(applicationId)) {
      setError('Invalid application id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getJobApplicationDetail(applicationId);
      setDetail(response.data);
      setSelectedStatus(null);
      setReason('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load application');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [applicationId]);

  useEffect(() => {
    if (!rejectDialogOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !reviewing) {
        setRejectDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rejectDialogOpen, reviewing]);

  const reviewActions = getReviewActions(detail?.status);

  const submitReviewDecision = async (status: JobApplicationReviewStatus, rejectionReason?: string) => {
    if (status === 'Rejected' && (rejectionReason?.trim().length ?? 0) < 3) {
      toast.danger('Reason required', {
        description: 'Add a rejection reason before rejecting this application.',
      });
      return;
    }

    setReviewing(true);

    try {
      await updateJobApplication(applicationId, {
        status,
        reason: status === 'Rejected' ? rejectionReason?.trim() : undefined,
      });
      toast.success('Application updated', {
        description: `Status changed to ${formatStatus(status)}.`,
      });
      setRejectDialogOpen(false);
      await loadDetail();
    } catch (reviewError) {
      toast.danger('Unable to update application', {
        description: reviewError instanceof Error ? reviewError.message : 'The application status could not be updated.',
      });
    } finally {
      setReviewing(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedStatus) {
      toast.danger('Choose an action', {
        description: 'Select the next application status before submitting.',
      });
      return;
    }

    if (selectedStatus === 'Rejected') {
      setRejectDialogOpen(true);
      return;
    }

    await submitReviewDecision(selectedStatus);
  };

  const handleDownloadCv = async () => {
    setDownloadingCv(true);

    try {
      const result = await downloadJobApplicationCandidateCv(applicationId);
      const objectUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      toast.danger('Unable to download CV', {
        description: downloadError instanceof Error ? downloadError.message : 'Candidate CV could not be downloaded.',
      });
    } finally {
      setDownloadingCv(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading application...
      </section>
    );
  }

  if (error && !detail) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-3xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onPress={() => void loadDetail()}>
            Retry
          </Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/job-applications">
            Back to applications
          </Link>
        </div>
      </section>
    );
  }

  const backToApplications = detail ? `/panel/job-applications?postingId=${detail.jobPosting.id}` : '/panel/job-applications';

  return (
    <div className="grid gap-6">
      {rejectDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button
              aria-label="Close rejection reason dialog"
              className="absolute inset-0 bg-black/40"
              type="button"
              disabled={reviewing}
              onClick={() => setRejectDialogOpen(false)}
            />
            <div
              aria-modal="true"
              role="dialog"
              className="relative z-10 w-full max-w-lg rounded-xl border border-divider bg-content1 p-6 shadow-2xl outline-none"
            >
              <h2 className="text-2xl text-foreground">Reject application?</h2>
              <p className="mt-3 text-sm leading-6 text-foreground-500">
                Add a reason before rejecting this application. This reason will be stored with the status change.
              </p>

              <label className="mt-5 grid gap-2 text-sm font-medium text-foreground">
                Rejection reason
                <TextArea
                  minLength={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why this application is being rejected."
                />
              </label>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="outline"
                  isDisabled={reviewing}
                  onPress={() => setRejectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="danger"
                  isDisabled={reviewing}
                  onPress={() => void submitReviewDecision('Rejected', reason)}
                >
                  {reviewing ? 'Rejecting...' : 'Reject application'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-500">
              <span className="text-sm text-foreground-500">Application #{detail?.id}</span>
            </div>
            <h2 className="mt-4 max-w-5xl text-4xl leading-[1.12] text-foreground sm:text-5xl">
              {detail?.user.name || 'Applicant'}
            </h2>
            <p className="mt-3 text-lg leading-7 text-foreground-500">
              {detail?.jobPosting.title || 'Untitled role'}
            </p>
          </div>

          <Link
            className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground"
            to={backToApplications}
          >
            Back to applications
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-divider pt-5 text-sm">
          <div>
            <span className="block text-foreground-500">Applied</span>
            <strong className="mt-1 block font-medium text-foreground">{formatDateTime(detail?.createdAt)}</strong>
          </div>
          <div>
            <span className="block text-foreground-500">Updated</span>
            <strong className="mt-1 block font-medium text-foreground">{formatDateTime(detail?.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="grid min-w-0 gap-6">
          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl text-foreground">Applicant</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">Candidate profile attached to this submission.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-divider bg-content2 p-4 text-sm">
                <span className="block text-foreground-500">Name</span>
                <strong className="mt-2 block font-medium text-foreground">{detail?.user.name || 'Unknown applicant'}</strong>
              </div>
              <div className="rounded-lg border border-divider bg-content2 p-4 text-sm">
                <span className="block text-foreground-500">Email</span>
                <strong className="mt-2 block truncate font-medium text-foreground" title={detail?.user.email}>
                  {detail?.user.email || 'No email'}
                </strong>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-sm font-medium text-foreground">Candidate skills</h4>
                <span className="text-sm text-foreground-500">{detail?.user.skills?.length || 0} listed</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(detail?.user.skills || []).length === 0 ? (
                  <div className="w-full rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                    No skills listed.
                  </div>
                ) : (
                  detail?.user.skills?.map((skill) => (
                    <Chip key={skill.id} className="rounded-md" size="sm" variant="secondary">
                      {skill.name} · {skill.yearsOfExperience === null ? 'No YOE required' : `${skill.yearsOfExperience}y`}
                    </Chip>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl text-foreground">Job posting</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">Role context for this application.</p>
              </div>
              <Chip className="rounded-md" size="sm" variant="secondary">
                {detail?.jobPosting.status || 'Unknown'}
              </Chip>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-divider bg-content2 p-4 text-sm">
                <span className="block text-foreground-500">Title</span>
                <strong className="mt-2 block font-medium text-foreground">{detail?.jobPosting.title || 'Untitled role'}</strong>
              </div>
              <div className="rounded-lg border border-divider bg-content2 p-4 text-sm">
                <span className="block text-foreground-500">Company</span>
                {detail?.jobPosting.company.id ? (
                  <Link className="mt-2 block font-medium text-foreground underline-offset-4 hover:underline" to={`/companies/${detail.jobPosting.company.id}`}>
                    {detail.jobPosting.company.name || 'Unknown company'}
                  </Link>
                ) : (
                  <strong className="mt-2 block font-medium text-foreground">{detail?.jobPosting.company.name || 'Unknown company'}</strong>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl text-foreground">Required skills</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">Skills requested for this posting.</p>
              </div>
              <span className="text-sm text-foreground-500">{detail?.jobPosting.skills?.length || 0} listed</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(detail?.jobPosting.skills || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500 sm:col-span-2">
                  No skill requirements listed.
                </div>
              ) : (
                detail?.jobPosting.skills?.map((skill) => (
                  <div key={skill.id} className="rounded-lg border border-divider bg-content2 p-4 text-sm text-foreground">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{skill.name}</strong>
                      <span className="text-foreground-500">
                        {skill.requiredYearsOfExperience === null ? 'Any experience' : `${skill.requiredYearsOfExperience}y required`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {error && detail && (
            <section className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm leading-6 text-danger-700 sm:p-8">
              {error}
            </section>
          )}
        </main>

        <aside className="grid gap-6 lg:sticky lg:top-6">
          <section className="rounded-xl border border-divider bg-content1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl text-foreground">Review</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">Choose the next application status.</p>
              </div>
              <Chip className="rounded-md" color={getStatusColor(detail?.status)} size="sm" variant="soft">
                {formatStatus(detail?.status)}
              </Chip>
            </div>

            {reviewActions.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                This application has no available status actions.
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <div className="grid gap-2">
                  {reviewActions.map((action) => (
                    <Button
                      key={action.status}
                      className={getReviewActionClassName(action.status, selectedStatus === action.status)}
                      type="button"
                      variant={selectedStatus === action.status ? 'primary' : 'secondary'}
                      onPress={() => {
                        setSelectedStatus(action.status);

                        if (action.status !== 'Rejected') {
                          setReason('');
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                <Button
                  className="w-full rounded-lg"
                  type="button"
                  variant="primary"
                  isDisabled={!selectedStatus || reviewing}
                  onPress={() => void handleReviewSubmit()}
                >
                  {reviewing ? 'Updating...' : 'Submit decision'}
                </Button>
              </div>
            )}

            <div className="mt-6 border-t border-divider pt-5">
              <Button
                className="w-full rounded-lg"
                type="button"
                variant="secondary"
                isDisabled={downloadingCv}
                onPress={() => void handleDownloadCv()}
              >
                {downloadingCv ? 'Downloading...' : 'Download CV'}
              </Button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};
