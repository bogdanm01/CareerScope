import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { Button, Chip, TextArea, toast } from '@heroui/react';
import { ArrowLeft, CalendarDays, Check, Download, Mail, X } from 'lucide-react';
import {
  downloadJobApplicationCandidateCv,
  getJobApplicationDetail,
  updateJobApplication,
  type JobApplicationDetail,
  type JobApplicationReviewStatus,
} from '../lib/job-applications-api';
import { formatDate, formatDateTime } from '../lib/date-format';
import { ApplicationInterviewTimeline } from '../components/ApplicationInterviewTimeline';
import { updateJobPosting } from '../lib/job-postings-api';
import { HttpError } from '../lib/http';

const getReviewActions = (status?: string): { status: JobApplicationReviewStatus; label: string }[] => {
  if (status === 'Submitted') {
    return [
      { status: 'UnderReview', label: 'Mark under review' },
      { status: 'Rejected', label: 'Reject' },
    ];
  }

  if (status === 'UnderReview') {
    return [
      { status: 'Interviewing', label: 'Start interviewing' },
      { status: 'Hired', label: 'Mark as hired' },
      { status: 'Rejected', label: 'Reject' },
    ];
  }

  if (status === 'Interviewing') {
    return [
      { status: 'Hired', label: 'Mark as hired' },
      { status: 'Rejected', label: 'Reject' },
    ];
  }

  return [];
};

const getReviewActionClassName = (status: JobApplicationReviewStatus, isSelected: boolean) => {
  const baseClassName = 'w-full justify-center !rounded-lg';

  if (status === 'Hired') {
    return isSelected
      ? `${baseClassName} status-success-solid border`
      : `${baseClassName} status-success border`;
  }

  if (status === 'Rejected') {
    return isSelected
      ? `${baseClassName} status-danger-solid border`
      : `${baseClassName} status-danger border`;
  }

  return isSelected
    ? `${baseClassName} bg-brand text-brand-foreground`
    : baseClassName;
};

const formatStatus = (status?: string) => {
  if (!status) {
    return 'Unknown';
  }

  return status === 'UnderReview' ? 'Under Review' : status;
};

const getStatusColor = (status?: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Hired':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'UnderReview':
      return 'warning';
    case 'Interviewing':
      return 'accent';
    case 'Submitted':
      return 'accent';
    default:
      return 'default';
  }
};

const getSkillMatches = (detail: JobApplicationDetail | null) => {
  const requiredSkills = detail?.jobPosting.skills ?? [];
  const candidateSkills = detail?.user.skills ?? [];

  return requiredSkills.map((requiredSkill) => {
    const candidateSkill = candidateSkills.find((skill) => skill.id === requiredSkill.id);
    const requiredYears = requiredSkill.requiredYearsOfExperience;
    const candidateYears = candidateSkill?.yearsOfExperience ?? null;
    const isMatched = Boolean(
      candidateSkill &&
        (requiredYears === null ||
          requiredYears === undefined ||
          candidateYears === null ||
          candidateYears === undefined ||
          candidateYears >= requiredYears),
    );

    return {
      id: requiredSkill.id,
      name: requiredSkill.name,
      isMatched,
      candidateYears,
      requiredYears,
    };
  });
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
  const [hireFlowDialogOpen, setHireFlowDialogOpen] = useState(false);
  const [hireFlowStep, setHireFlowStep] = useState<'incomplete-activities' | 'posting-decision'>('incomplete-activities');
  const [closingPosting, setClosingPosting] = useState(false);
  const [incompleteActivitiesMessage, setIncompleteActivitiesMessage] = useState('');

  const applicationId = Number(id);

  const loadDetail = async (showLoading = true) => {
    if (!Number.isFinite(applicationId)) {
      setError('Invalid application id.');
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
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
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDetail(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  useEffect(() => {
    if (!rejectDialogOpen && !hireFlowDialogOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !reviewing) {
        setRejectDialogOpen(false);
      }

      if (event.key === 'Escape' && !reviewing && !closingPosting) {
        setHireFlowDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closingPosting, hireFlowDialogOpen, rejectDialogOpen, reviewing]);

  const reviewActions = getReviewActions(detail?.status);
  const postingCanBeClosed = detail?.jobPosting.status === 'Active' || detail?.jobPosting.status === 'Paused';

  const submitReviewDecision = async (
    status: JobApplicationReviewStatus,
    rejectionReason?: string,
    confirmIncompleteActivities = false,
  ) => {
    if (status === 'Rejected' && (rejectionReason?.trim().length ?? 0) < 3) {
      toast.danger('Reason required', {
        description: 'Add a rejection reason before rejecting this application.',
      });
      return;
    }

    setReviewing(true);
    const shouldPromptToClosePosting = status === 'Hired' && postingCanBeClosed;

    try {
      await updateJobApplication(applicationId, {
        status,
        reason: status === 'Rejected' ? rejectionReason?.trim() : undefined,
        confirmIncompleteActivities: status === 'Hired' ? confirmIncompleteActivities : undefined,
      });
      toast.success('Application updated', {
        description: `Status changed to ${formatStatus(status)}.`,
      });
      setSelectedStatus(null);
      setRejectDialogOpen(false);
      setIncompleteActivitiesMessage('');
      await loadDetail(false);

      if (shouldPromptToClosePosting) {
        setHireFlowStep('posting-decision');
        setHireFlowDialogOpen(true);
      } else {
        setHireFlowDialogOpen(false);
      }
    } catch (reviewError) {
      if (
        status === 'Hired' &&
        reviewError instanceof HttpError &&
        (reviewError.code === 'INCOMPLETE_INTERVIEW_ACTIVITIES' || reviewError.status === 409)
      ) {
        setIncompleteActivitiesMessage(reviewError.message);
        setHireFlowStep('incomplete-activities');
        setHireFlowDialogOpen(true);
        return;
      }

      toast.danger('Unable to update application', {
        description: reviewError instanceof Error ? reviewError.message : 'The application status could not be updated.',
      });
    } finally {
      setReviewing(false);
    }
  };

  const closeJobPosting = async () => {
    if (!detail) {
      return;
    }

    setClosingPosting(true);

    try {
      await updateJobPosting(detail.jobPosting.id, { status: 'Closed' });
      toast.success('Job posting closed', {
        description: 'The role is no longer accepting new applications.',
      });
      setHireFlowDialogOpen(false);
      await loadDetail(false);
    } catch (closeError) {
      toast.danger('Candidate hired, but posting is still open', {
        description: closeError instanceof Error ? closeError.message : 'The job posting could not be closed.',
      });
    } finally {
      setClosingPosting(false);
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
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
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
  const skillMatches = getSkillMatches(detail);
  const matchedSkillCount = skillMatches.filter((skill) => skill.isMatched).length;

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

      {hireFlowDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button
              aria-label={hireFlowStep === 'incomplete-activities' ? 'Return to interview activities' : 'Keep job posting open'}
              className="absolute inset-0 bg-black/40"
              type="button"
              disabled={reviewing || closingPosting}
              onClick={() => setHireFlowDialogOpen(false)}
            />
            <div
              aria-modal="true"
              role="dialog"
              className="relative z-10 w-full max-w-lg rounded-xl border border-divider bg-content1 p-6 shadow-2xl outline-none"
            >
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-400">
                Step {hireFlowStep === 'incomplete-activities' ? '1' : '2'} of {postingCanBeClosed ? '2' : '1'}
              </p>

              {hireFlowStep === 'incomplete-activities' ? (
                <>
                  <h2 className="mt-2 text-2xl text-foreground">Interview activities are incomplete</h2>
                  <p className="mt-3 text-sm leading-6 text-foreground-500">
                    {incompleteActivitiesMessage || 'Not every interview activity is marked as completed.'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground-500">
                    You can return to the timeline and complete the remaining activities, or continue and finalize this application now.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Button
                      className="rounded-lg"
                      type="button"
                      variant="outline"
                      isDisabled={reviewing}
                      onPress={() => setHireFlowDialogOpen(false)}
                    >
                      Go back
                    </Button>
                    <Button
                      className="rounded-lg"
                      type="button"
                      variant="primary"
                      isDisabled={reviewing}
                      onPress={() => void submitReviewDecision('Hired', undefined, true)}
                    >
                      {reviewing ? 'Marking as hired...' : 'Mark as hired anyway'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl text-foreground">Is this role filled?</h2>
                  <p className="mt-3 text-sm leading-6 text-foreground-500">
                    The candidate was marked as hired. Close the job posting if you are no longer hiring for this role, or keep it open to hire more people.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Button
                      className="rounded-lg"
                      type="button"
                      variant="outline"
                      isDisabled={closingPosting}
                      onPress={() => setHireFlowDialogOpen(false)}
                    >
                      Keep open for more hires
                    </Button>
                    <Button
                      className="rounded-lg"
                      type="button"
                      variant="primary"
                      isDisabled={closingPosting}
                      onPress={() => void closeJobPosting()}
                    >
                      {closingPosting ? 'Closing...' : 'Close job posting'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      <section className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground-500">Application #{detail?.id}</p>
          <h2 className="mt-3 max-w-5xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl">
            {detail?.user.name || 'Applicant'}
          </h2>
          <p className="mt-3 text-lg leading-7 text-foreground-500">
            {detail?.jobPosting.title || 'Untitled role'} · {detail?.jobPosting.company.name || 'Unknown company'}
          </p>
        </div>

        <Link
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-divider bg-content1 px-4 text-sm font-medium text-foreground transition-colors hover:bg-content2"
          to={backToApplications}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to applications
        </Link>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="grid min-w-0 gap-6">
          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Skills match</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">Candidate skills compared with this posting’s requirements.</p>
              </div>
              <Chip className="rounded-lg" color={matchedSkillCount === skillMatches.length ? 'success' : 'warning'} size="sm" variant="soft">
                {matchedSkillCount} of {skillMatches.length} required
              </Chip>
            </div>

            <div className="mt-6 grid gap-3">
              {skillMatches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                  No skill requirements listed for this posting.
                </div>
              ) : (
                skillMatches.map((skill) => (
                  <div
                    key={skill.id}
                    className={[
                      'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
                      skill.isMatched ? 'status-success' : 'status-danger',
                    ].join(' ')}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3 font-medium">
                      {skill.isMatched ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{skill.name}</span>
                    </span>
                    <span className="text-right">
                      {skill.isMatched
                        ? `${skill.candidateYears ?? 'Any'}y experience · ${skill.requiredYears ?? 'Any'}y required`
                        : `not listed · ${skill.requiredYears ?? 'Any'}y required`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Contact</h3>
            <div className="mt-5 grid gap-3 text-sm text-foreground-600">
              <div className="flex min-w-0 items-center gap-3">
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground-500" />
                <span className="truncate" title={detail?.user.email}>{detail?.user.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground-500" />
                <span>
                  Applied {formatDate(detail?.createdAt)} · updated {formatDate(detail?.updatedAt)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Candidate skills</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">Full skill list submitted on the profile.</p>
              </div>
              <span className="text-sm text-foreground-500">{detail?.user.skills?.length || 0} listed</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(detail?.user.skills || []).length === 0 ? (
                <div className="w-full rounded-lg border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                  No candidate skills listed.
                </div>
              ) : (
                detail?.user.skills?.map((skill) => (
                  <Chip key={skill.id} className="rounded-lg" size="sm" variant="secondary">
                    {skill.name} · {skill.yearsOfExperience === null ? 'No YOE' : `${skill.yearsOfExperience}y`}
                  </Chip>
                ))
              )}
            </div>
          </section>

          {error && detail && (
            <section className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm leading-6 text-danger-700 sm:p-8">
              {error}
            </section>
          )}

          <ApplicationInterviewTimeline
            applicationId={applicationId}
            applicationStatus={detail?.status ?? ''}
            mode="manage"
          />
        </main>

        <aside className="grid gap-6 lg:sticky lg:top-6">
          <section className="rounded-xl border border-divider bg-content1 p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Review</h3>
              <Chip className="rounded-md" color={getStatusColor(detail?.status)} size="sm" variant="soft">
                {formatStatus(detail?.status)}
              </Chip>
            </div>

            <Button
              className="mt-6 w-full !rounded-lg"
              type="button"
              variant="outline"
              isDisabled={downloadingCv}
              onPress={() => void handleDownloadCv()}
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                {downloadingCv ? 'Downloading...' : 'Download CV'}
              </span>
            </Button>

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
                  className="w-full !rounded-lg"
                  type="button"
                  variant="primary"
                  isDisabled={!selectedStatus || reviewing}
                  onPress={() => void handleReviewSubmit()}
                >
                  {reviewing ? 'Updating...' : 'Submit decision'}
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6">
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                Application status history
              </h3>
              <p className="mt-2 text-sm leading-6 text-foreground-500">
                Complete audit trail of this application’s lifecycle.
              </p>
            </div>

            <div className="mt-5 grid gap-0">
              {(detail?.statusHistory || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                  No application status history is available.
                </div>
              ) : (
                detail?.statusHistory?.map((entry, index) => {
                  const isLast = index === (detail.statusHistory?.length ?? 0) - 1;

                  return (
                    <div key={entry.id} className={isLast ? 'pb-0' : 'pb-5'}>
                      <Chip
                        className="rounded-md"
                        color={getStatusColor(entry.status)}
                        size="sm"
                        variant="soft"
                      >
                        {formatStatus(entry.status)}
                      </Chip>
                      <span className="mt-2 block text-xs text-foreground-500">
                        {formatDateTime(entry.createdAt)}
                      </span>
                      {entry.reason && (
                        <p className="mt-2 text-sm leading-6 text-foreground-500">{entry.reason}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};
