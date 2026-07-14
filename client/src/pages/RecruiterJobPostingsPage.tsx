import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Dropdown, Input, Table } from '@heroui/react';
import { ChevronLeft, ChevronRight, MoreHorizontal, PanelTopOpen, Plus, RotateCcw, Search } from 'lucide-react';
import { getRecruiterJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { formatDate } from '../lib/date-format';
import { StatusMultiSelect } from '../components/StatusMultiSelect';
import { useRecruiterPostingAccess } from '../hooks/useRecruiterPostingAccess';
import { CompanyApprovalRequiredCard } from '../components/CompanyApprovalRequiredCard';

const pageSize = 10;

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
    return 'Pending Approval';
  }

  return status;
};

export const RecruiterJobPostingsPage = () => {
  const navigate = useNavigate();
  const {
    company,
    loading: approvalLoading,
    error: approvalError,
    isBlocked,
    showBlockedToast,
  } = useRecruiterPostingAccess();
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  useEffect(() => {
    if (approvalLoading || isBlocked) {
      return;
    }

    let cancelled = false;

    getRecruiterJobPostings().then(
      (response) => {
        if (!cancelled) {
          setPostings(response.data);
        }
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load job postings');
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [approvalLoading, isBlocked]);

  const statusOptions = useMemo(
    () => Array.from(new Set(postings.map((posting) => posting.status))).sort().map((status) => ({
      value: status,
      label: getStatusLabel(status),
    })),
    [postings],
  );
  const filteredPostings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return postings.filter((posting) => {
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(posting.status);
      const matchesSearch =
        !query ||
        [posting.title, posting.shortDescription]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [postings, search, statusFilters]);
  const totalPages = Math.max(1, Math.ceil(filteredPostings.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedPostings = useMemo(
    () => filteredPostings.slice((visiblePage - 1) * pageSize, visiblePage * pageSize),
    [filteredPostings, visiblePage],
  );

  return (
    <div className="grid gap-8">
      <section className="p-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl leading-[1.15] text-foreground">Your postings</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Manage drafts, approval requests, and active job postings from one place.
            </p>
          </div>
          <Button
            className={`rounded-lg ${isBlocked ? 'cursor-not-allowed opacity-50' : ''}`}
            type="button"
            variant="primary"
            isDisabled={approvalLoading}
            aria-disabled={isBlocked}
            onPress={() => {
              if (isBlocked) {
                showBlockedToast();
                return;
              }
              navigate('/panel/job-postings/new');
            }}
          >
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            <span>Add posting</span>
          </Button>
        </div>

        {approvalLoading ? (
          <div className="mt-5 rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500">
            Checking company approval...
          </div>
        ) : isBlocked ? (
          <div className="mt-5">
            <CompanyApprovalRequiredCard
              area="postings"
              company={company}
              verificationError={approvalError}
            />
          </div>
        ) : error ? (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        ) : null}

        {!approvalLoading && !isBlocked && (postings.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No job postings yet. Create your first posting to start collecting applicants.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_40px]">
              <label className="relative block">
                <span className="sr-only">Search job postings</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500" />
                <Input
                  aria-label="Search job postings"
                  className="h-10 w-full rounded-lg pl-9 text-sm"
                  fullWidth
                  placeholder="Search by role or description"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </label>

              <StatusMultiSelect
                ariaLabel="Filter job postings by status"
                options={statusOptions}
                selectedValues={statusFilters}
                onChange={(values) => {
                  setStatusFilters(values.length === statusOptions.length ? [] : values);
                  setCurrentPage(1);
                }}
              />

              <Button
                isIconOnly
                aria-label="Reset job posting filters"
                className="h-10 w-10 min-w-10 border border-divider text-foreground-500"
                type="button"
                variant="ghost"
                isDisabled={!search && statusFilters.length === 0}
                onPress={() => {
                  setSearch('');
                  setStatusFilters([]);
                  setCurrentPage(1);
                }}
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </Button>
            </div>

            {filteredPostings.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-divider bg-content2/50 p-6 text-sm text-foreground-500">
                No job postings match the current filters.
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-xl border border-divider bg-content1">
                <Table variant="secondary">
                  <Table.ScrollContainer>
                    <Table.Content aria-label="Recruiter job postings">
                      <Table.Header>
                        <Table.Column isRowHeader>Role</Table.Column>
                        <Table.Column>Status</Table.Column>
                        <Table.Column>Expires</Table.Column>
                        <Table.Column>Created</Table.Column>
                        <Table.Column>Action</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {paginatedPostings.map((posting) => (
                          <Table.Row key={posting.id} id={posting.id}>
                            <Table.Cell>
                              <div className="min-w-64">
                                <span className="block font-medium text-foreground">{posting.title || 'Untitled role'}</span>
                                <span className="mt-1 block line-clamp-2 text-sm text-foreground-500">
                                  {posting.shortDescription || 'No description yet.'}
                                </span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Chip
                                className="rounded-md"
                                color={getStatusColor(posting.status)}
                                size="sm"
                                variant="soft"
                              >
                                {getStatusLabel(posting.status)}
                              </Chip>
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
                                  aria-label={`${posting.title || 'Job posting'} actions`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 text-foreground transition-colors hover:bg-content2"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Dropdown.Trigger>
                                <Dropdown.Popover placement="bottom end">
                                  <Dropdown.Menu aria-label={`${posting.title || 'Job posting'} actions`}>
                                    <Dropdown.Item
                                      href={`/panel/job-postings/${posting.id}`}
                                      textValue="Open detail"
                                    >
                                      <span className="inline-flex w-full items-center gap-2">
                                        <PanelTopOpen className="h-4 w-4" />
                                        Open detail
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
                    <span className="text-sm text-foreground-500">
                      Page {visiblePage} of {totalPages}
                    </span>
                    <Button
                      isIconOnly
                      aria-label="Previous page"
                      type="button"
                      variant="outline"
                      size="sm"
                      onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      isDisabled={visiblePage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      isIconOnly
                      aria-label="Next page"
                      type="button"
                      variant="outline"
                      size="sm"
                      onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      isDisabled={visiblePage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ))}
      </section>
    </div>
  );
};
