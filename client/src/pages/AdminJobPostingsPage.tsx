import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Chip, Dropdown, Input, ListBox, Select, Table, Tabs, TextArea, toast } from '@heroui/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PanelTopOpen,
  Search,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  approveJobPosting,
  getAdminCompanies,
  getAdminJobPostings,
  getPendingJobPostings,
  rejectJobPosting,
  type AdminCompanyListItem,
} from '../lib/admin-api';
import { type JobPostingListItem } from '../lib/job-postings-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate } from '../lib/date-format';
import { StatusMultiSelect } from '../components/StatusMultiSelect';
import { CompanySelectOption } from '../components/CompanySelectOption';

const pageSize = 25;
const postingStatusOptions = [
  { value: 'Draft', label: 'Draft' },
  { value: 'PendingApproval', label: 'Pending approval' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Active', label: 'Active' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Expired', label: 'Expired' },
];
const postingStatusesWithApplications = new Set(['Active', 'Paused', 'Closed', 'Expired']);

type PostingFilters = {
  search: string;
  companyIds: string[];
  statuses: string[];
};

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
  const [searchParams, setSearchParams] = useSearchParams();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>(
    searchParams.get('tab') === 'all' ? 'all' : 'pending',
  );
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(searchParams.getAll('companyId'));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(searchParams.getAll('status'));
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [confirmPostingId, setConfirmPostingId] = useState<number | null>(null);
  const [rejectPostingId, setRejectPostingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasFilters = searchDraft.trim().length > 0 || selectedCompanyIds.length > 0 || selectedStatuses.length > 0;
  const selectedCompany = selectedCompanyIds.length === 1
    ? companies.find((company) => String(company.id) === selectedCompanyIds[0])
    : null;

  const loadPostings = async (
    page = currentPage,
    tab = selectedTab,
    filters: PostingFilters = { search, companyIds: selectedCompanyIds, statuses: selectedStatuses },
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await (tab === 'pending' ? getPendingJobPostings : getAdminJobPostings)({
        page,
        limit: pageSize,
        search: tab === 'all' && filters.search ? filters.search : undefined,
        companyIds: tab === 'all' && filters.companyIds.length ? filters.companyIds.join(',') : undefined,
        statuses: tab === 'all' && filters.statuses.length ? filters.statuses.join(',') : undefined,
      });
      setPostings(response.data);
      setCurrentPage(response.pagination?.currentPage ?? page);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (loadError) {
      setPostings([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPostings(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getAdminCompanies({ page: 1, limit: 100, isDeleted: false }).then(
      (response) => {
        if (!cancelled) {
          setCompanies(response.data.sort((left, right) => left.name.localeCompare(right.name)));
        }
      },
      () => {
        if (!cancelled) {
          setCompanies([]);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmedSearch = searchDraft.trim();
    const nextSearch = trimmedSearch.length >= 2 ? trimmedSearch : '';

    if (nextSearch === search) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextSearch) {
        nextParams.set('search', nextSearch);
      } else {
        nextParams.delete('search');
      }
      nextParams.set('tab', 'all');
      setSearchParams(nextParams, { replace: true });
      setSearch(nextSearch);
      setCurrentPage(1);
      if (selectedTab === 'all') {
        void loadPostings(1, 'all', {
          search: nextSearch,
          companyIds: selectedCompanyIds,
          statuses: selectedStatuses,
        });
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchDraft]);

  const handleTabChange = (key: React.Key) => {
    const nextTab = key === 'all' ? 'all' : 'pending';
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
    setSelectedTab(nextTab);
    setCurrentPage(1);
    void loadPostings(1, nextTab);
  };

  const updateCompanyFilters = (values: string[]) => {
    const nextValues = values.length === companies.length ? [] : values;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('companyId');
    nextValues.forEach((companyId) => nextParams.append('companyId', companyId));
    nextParams.set('tab', 'all');
    setSearchParams(nextParams, { replace: true });
    setSelectedCompanyIds(nextValues);
    setCurrentPage(1);
    void loadPostings(1, 'all', { search, companyIds: nextValues, statuses: selectedStatuses });
  };

  const updateStatusFilters = (values: string[]) => {
    const nextValues = values.length === postingStatusOptions.length ? [] : values;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    nextValues.forEach((status) => nextParams.append('status', status));
    nextParams.set('tab', 'all');
    setSearchParams(nextParams, { replace: true });
    setSelectedStatuses(nextValues);
    setCurrentPage(1);
    void loadPostings(1, 'all', { search, companyIds: selectedCompanyIds, statuses: nextValues });
  };

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    nextParams.delete('companyId');
    nextParams.delete('status');
    nextParams.set('tab', 'all');
    setSearchParams(nextParams, { replace: true });
    setSearchDraft('');
    setSearch('');
    setSelectedCompanyIds([]);
    setSelectedStatuses([]);
    setCurrentPage(1);
    void loadPostings(1, 'all', { search: '', companyIds: [], statuses: [] });
  };

  const handleApprove = async (jobPostingId: number) => {
    setActioningId(jobPostingId);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await approveJobPosting(jobPostingId);
      toast.success('Job posting approved', {
        description: 'The posting is now active and visible to candidates.',
      });
      await loadPostings();
    } catch (approveError) {
      const message = approveError instanceof Error ? approveError.message : 'Unable to approve job posting';
      toast.danger('Unable to approve job posting', { description: message });
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
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await rejectJobPosting(rejectPostingId, rejectionReason.trim());
      toast.success('Job posting rejected', {
        description: 'The recruiter can review the rejection reason.',
      });
      setRejectPostingId(null);
      setRejectionReason('');
      await loadPostings();
    } catch (rejectError) {
      const message = rejectError instanceof Error ? rejectError.message : 'Unable to reject job posting';
      toast.danger('Unable to reject job posting', { description: message });
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

      <section className="p-0">
        <h2 className="text-4xl leading-[1.15] text-foreground">Job postings</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
          Review pending approvals or browse every job posting across companies.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}
      </section>

      <Tabs className="w-full" selectedKey={selectedTab} onSelectionChange={handleTabChange}>
        <Tabs.ListContainer className="max-w-md">
          <Tabs.List aria-label="Admin job posting views">
            <Tabs.Tab id="pending">
              Pending approval
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="all">
              All postings
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id={selectedTab} className="w-full pt-4">
          <div className="grid gap-5">
            {selectedTab === 'all' && (
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1fr)_240px_220px_auto]">
                <label className="relative block">
                  <span className="sr-only">Search job postings</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500"
                  />
                  <Input
                    aria-label="Search job postings"
                    className="h-10 rounded-lg pl-9 text-sm"
                    placeholder="Search job postings"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                  />
                </label>

                <Select
                  aria-label="Filter job postings by company"
                  selectionMode="multiple"
                  value={selectedCompanyIds}
                  onChange={(keys) => updateCompanyFilters(keys.map(String))}
                >
                  <Select.Trigger className="h-10 rounded-lg text-sm">
                    <Select.Value>
                      {({ selectedText }) => {
                        if (selectedCompanyIds.length === 0 || selectedCompanyIds.length === companies.length) {
                          return 'All companies';
                        }

                        if (selectedCompanyIds.length === 1 && selectedCompany) {
                          return (
                            <CompanySelectOption
                              name={selectedCompany.name}
                              logoUrl={selectedCompany.logoUrl}
                              websiteUrl={selectedCompany.websiteUrl}
                            />
                          );
                        }

                        return selectedCompanyIds.length === 1
                          ? selectedText
                          : `${selectedCompanyIds.length} companies`;
                      }}
                    </Select.Value>
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox aria-label="Company filter options" className="max-h-72 overflow-auto">
                      {companies.map((company) => (
                        <ListBox.Item key={company.id} id={String(company.id)} textValue={company.name}>
                          <span className="flex-1">
                            <CompanySelectOption
                              name={company.name}
                              logoUrl={company.logoUrl}
                              websiteUrl={company.websiteUrl}
                            />
                          </span>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <StatusMultiSelect
                  ariaLabel="Filter job postings by status"
                  options={postingStatusOptions}
                  selectedValues={selectedStatuses}
                  onChange={updateStatusFilters}
                />

                <Button
                  isIconOnly
                  aria-label="Clear job posting filters"
                  className="h-10 w-10 rounded-lg"
                  type="button"
                  variant="outline"
                  isDisabled={!hasFilters}
                  onPress={clearFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              </section>
            )}

          <section className="overflow-hidden rounded-xl border border-divider bg-content1">
        {loading ? (
          <div className="p-6 text-sm text-foreground-500">
            {selectedTab === 'pending' ? 'Loading pending postings...' : 'Loading all postings...'}
          </div>
        ) : postings.length === 0 ? (
          <div className="m-6 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            {selectedTab === 'pending' ? 'No pending job postings.' : 'No job postings found.'}
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label={selectedTab === 'pending' ? 'Pending job postings' : 'All job postings'}>
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
                              {postingStatusesWithApplications.has(posting.status) && (
                                <Dropdown.Item
                                  textValue="View applications"
                                  onPress={() => {
                                    const params = new URLSearchParams({ postingId: String(posting.id) });
                                    if (posting.company?.id) {
                                      params.set('companyId', String(posting.company.id));
                                    }
                                    navigate(`/panel/job-applications?${params.toString()}`);
                                  }}
                                >
                                  <span className="inline-flex w-full items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    View applications
                                  </span>
                                </Dropdown.Item>
                              )}
                              {posting.status === 'PendingApproval' && (
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
                              )}
                              {posting.status === 'PendingApproval' && (
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
                              )}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
            <span className="text-sm text-foreground-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              isIconOnly
              aria-label="Previous page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadPostings(Math.max(1, currentPage - 1), selectedTab)}
              isDisabled={loading || currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              isIconOnly
              aria-label="Next page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadPostings(Math.min(totalPages, currentPage + 1), selectedTab)}
              isDisabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
          </section>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};
