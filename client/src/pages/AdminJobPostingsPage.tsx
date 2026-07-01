import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Dropdown, Table, TextArea } from '@heroui/react';
import { CheckCircle2, ChevronLeft, ChevronRight, MoreHorizontal, PanelTopOpen, XCircle } from 'lucide-react';
import { approveJobPosting, getPendingJobPostings, rejectJobPosting } from '../lib/admin-api';
import { type JobPostingListItem } from '../lib/job-postings-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate } from '../lib/date-format';

const getStatusColor = (status: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'PendingApproval':
      return 'warning';
    case 'Rejected':
    case 'Expired':
      return 'danger';
    case 'Draft':
      return 'accent';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  if (status === 'PendingApproval') {
    return 'Pending approval';
  }

  return status;
};

export const AdminJobPostingsPage = () => {
  const navigate = useNavigate();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [confirmPostingId, setConfirmPostingId] = useState<number | null>(null);
  const [rejectPostingId, setRejectPostingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
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

  const handleReject = async () => {
    if (rejectPostingId === null || rejectionReason.trim().length < 3) {
      setError('Rejection reason must be at least 3 characters.');
      return;
    }

    setActioningId(rejectPostingId);
    setMessage(null);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await rejectJobPosting(rejectPostingId, rejectionReason.trim());
      setMessage('Job posting rejected successfully.');
      setRejectPostingId(null);
      setRejectionReason('');
      await loadPostings();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Unable to reject job posting');
    } finally {
      setActioningId(null);
      setAuthLoading(false);
    }
  };

  return (
    <div className="grid gap-8">
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

      {rejectPostingId !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button
              aria-label="Close rejection dialog"
              className="absolute inset-0 bg-black/40"
              type="button"
              disabled={actioningId !== null}
              onClick={() => {
                setRejectPostingId(null);
                setRejectionReason('');
              }}
            />
            <div
              aria-modal="true"
              role="dialog"
              className="relative z-10 w-full max-w-lg rounded-xl border border-divider bg-content1 p-6 shadow-2xl outline-none"
            >
              <h2 className="text-2xl text-foreground">Reject job posting?</h2>
              <p className="mt-3 text-sm leading-6 text-foreground-500">
                Add a reason so the recruiter knows what needs to be fixed before resubmitting.
              </p>
              <div className="mt-5 grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="job-posting-rejection-reason">
                  Rejection reason
                </label>
                <TextArea
                  id="job-posting-rejection-reason"
                  minLength={3}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Explain why this posting is being rejected"
                />
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  className="rounded-lg"
                  variant="outline"
                  isDisabled={actioningId !== null}
                  onPress={() => {
                    setRejectPostingId(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-lg"
                  variant="danger"
                  isDisabled={actioningId !== null || rejectionReason.trim().length < 3}
                  onPress={() => void handleReject()}
                >
                  {actioningId !== null ? 'Rejecting...' : 'Reject posting'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl leading-[1.15] text-foreground">Approve job postings</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review pending postings from recruiters and approve the ones ready to go live.
            </p>
          </div>

          <Button type="button" variant="secondary" onPress={() => void loadPostings()} isDisabled={loading}>
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
          <h3 className="text-2xl text-foreground">Pending postings</h3>
          <div className="flex items-center gap-2 text-sm text-foreground-500">
            <Button
              isIconOnly
              aria-label="Previous page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadPostings(Math.max(1, currentPage - 1))}
              isDisabled={loading || currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              isIconOnly
              aria-label="Next page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadPostings(Math.min(totalPages, currentPage + 1))}
              isDisabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading pending postings...
          </div>
        ) : postings.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No pending job postings.
          </div>
        ) : (
          <Table className="mt-5" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Pending job postings">
                <Table.Header>
                  <Table.Column isRowHeader>ID</Table.Column>
                  <Table.Column>Role</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Company</Table.Column>
                  <Table.Column>Expires</Table.Column>
                  <Table.Column>Created</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {postings.map((posting) => (
                    <Table.Row key={posting.id} id={posting.id}>
                      <Table.Cell>
                        <span className="whitespace-nowrap font-medium text-foreground">#{posting.id}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="min-w-64">
                          <span className="block font-medium text-foreground">{posting.title || 'Untitled role'}</span>
                          <span className="mt-1 block line-clamp-2 text-sm text-foreground-500">
                            {posting.shortDescription || 'No short description provided.'}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="whitespace-nowrap rounded-md"
                          color={getStatusColor(posting.status)}
                          size="sm"
                          variant="soft"
                        >
                          {getStatusLabel(posting.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">{posting.company?.name || 'Unknown'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(posting.expiresAt, 'No expiry')}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(posting.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Dropdown.Trigger
                            aria-label={`Job posting ${posting.id} actions`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 text-foreground transition-colors hover:bg-content2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover placement="bottom end">
                            <Dropdown.Menu aria-label={`Job posting ${posting.id} actions`}>
                              <Dropdown.Item
                                textValue="Open details"
                                onPress={() => navigate(`/panel/admin/job-postings/${posting.id}`, { state: { posting } })}
                              >
                                <span className="inline-flex w-full items-center gap-2">
                                  <PanelTopOpen className="h-4 w-4" />
                                  Open details
                                </span>
                              </Dropdown.Item>
                              <Dropdown.Item
                                textValue="Approve posting"
                                isDisabled={actioningId === posting.id}
                                onPress={() => requestPostingApproval(posting.id)}
                              >
                                <span className="inline-flex w-full items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {actioningId === posting.id ? 'Approving...' : 'Approve posting'}
                                </span>
                              </Dropdown.Item>
                              <Dropdown.Item
                                textValue="Reject posting"
                                isDisabled={actioningId === posting.id}
                                onPress={() => {
                                  setRejectPostingId(posting.id);
                                  setRejectionReason('');
                                }}
                              >
                                <span className="inline-flex w-full items-center gap-2 text-danger-600">
                                  <XCircle className="h-4 w-4" />
                                  Reject posting
                                </span>
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </section>
    </div>
  );
};
