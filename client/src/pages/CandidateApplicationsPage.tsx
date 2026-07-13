import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Chip, Dropdown, Input, Table } from '@heroui/react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  PanelTopOpen,
  RotateCcw,
  Search,
} from 'lucide-react';
import { getMyJobApplications, type CandidateJobApplicationListItem } from '../lib/job-applications-api';
import { formatDate } from '../lib/date-format';
import { StatusMultiSelect } from '../components/StatusMultiSelect';

const pageSize = 10;

const statusOptions = ['Submitted', 'UnderReview', 'Interviewing', 'Hired', 'Rejected', 'Withdrawn'];
const sortableFields = ['title', 'company', 'status', 'createdAt', 'updatedAt', 'expiresAt'] as const;
type SortField = typeof sortableFields[number];
type SortDirection = 'asc' | 'desc';
type SortEntry = { field: SortField; direction: SortDirection };

const getStatusColor = (status: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Hired':
      return 'success';
    case 'Rejected':
    case 'Withdrawn':
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

const getStatusLabel = (status: string) => (status === 'UnderReview' ? 'Under Review' : status);

const parseSort = (value: string | null): SortEntry[] => {
  const entries = (value || 'createdAt:desc')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [field, direction = 'asc'] = entry.split(':');
      if (!sortableFields.includes(field as SortField) || (direction !== 'asc' && direction !== 'desc')) {
        return null;
      }

      return { field: field as SortField, direction: direction as SortDirection };
    })
    .filter((entry): entry is SortEntry => entry !== null);

  return entries.length > 0 ? entries : [{ field: 'createdAt', direction: 'desc' }];
};

const serializeSort = (entries: SortEntry[]) => entries.map((entry) => `${entry.field}:${entry.direction}`).join(',');

export const CandidateApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<CandidateJobApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '');

  const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const selectedStatuses = useMemo(() => status.split(',').filter(Boolean), [status]);
  const sortEntries = useMemo(() => parseSort(searchParams.get('sort')), [searchParams]);
  const sort = serializeSort(sortEntries);
  const hasFilters = Boolean(search || status || searchParams.get('sort'));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearchDraft(search), 0);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const updateQuery = (changes: Record<string, string | number | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      return next;
    });
  };

  const loadApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyJobApplications({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        status: status || undefined,
        sort,
      });
      setApplications(response.data);
      setTotalPages(response.pagination?.totalPages ?? 1);
      setTotalItems(response.pagination?.totalItems ?? response.data.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load applications');
      setApplications([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadApplications(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, status, sort]);

  const applySearch = () => {
    updateQuery({ search: searchDraft.trim() || null, page: 1 });
  };

  const clearFilters = () => {
    setSearchDraft('');
    setSearchParams(new URLSearchParams());
  };

  const toggleSort = (field: SortField) => {
    const existing = sortEntries.find((entry) => entry.field === field);
    const nextDirection: SortDirection = existing?.direction === 'asc' ? 'desc' : 'asc';
    const nextSort = [
      { field, direction: nextDirection },
      ...sortEntries.filter((entry) => entry.field !== field),
    ];

    updateQuery({ sort: serializeSort(nextSort), page: 1 });
  };

  const renderSortButton = (field: SortField, label: string) => {
    const activeSort = sortEntries.find((entry) => entry.field === field);
    const directionLabel = activeSort?.direction === 'asc' ? 'ascending' : 'descending';

    return (
      <button
        type="button"
        aria-label={`Sort by ${label}${activeSort ? `, currently ${directionLabel}` : ''}`}
        className="inline-flex items-center gap-1.5 text-left font-medium text-foreground transition-colors hover:text-foreground-600"
        onClick={() => toggleSort(field)}
      >
        {label}
        {activeSort?.direction === 'asc' ? (
          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5 text-foreground" />
        ) : activeSort?.direction === 'desc' ? (
          <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 text-foreground-400" />
        )}
      </button>
    );
  };

  const emptyLabel = hasFilters
    ? 'No applications match the selected filters.'
    : 'No applications found yet.';

  return (
    <div className="grid gap-8">
      <section className="p-0">
        <div>
          <h2 className="text-4xl leading-[1.15] text-foreground">My applications</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Track every submission and open the full application record when you need more detail.
          </p>
        </div>

        <form
          className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_40px]"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search applications</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500" />
            <Input
              aria-label="Search applications"
              className="h-10 w-full rounded-lg pl-9 text-sm"
              fullWidth
              placeholder="Search job title or company"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>

          <StatusMultiSelect
            ariaLabel="Filter applications by status"
            options={statusOptions.map((option) => ({ value: option, label: getStatusLabel(option) }))}
            selectedValues={selectedStatuses}
            onChange={(values) => {
              updateQuery({
                status: values.length === 0 || values.length === statusOptions.length ? null : values.join(','),
                page: 1,
              });
            }}
          />

          <Button
            isIconOnly
            aria-label="Reset application filters"
            className="h-10 w-10 min-w-10 border border-divider text-foreground-500"
            type="button"
            variant="ghost"
            isDisabled={!hasFilters && !searchDraft}
            onPress={clearFilters}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </Button>
        </form>

        {error && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-divider bg-content1">
        {loading ? (
          <div className="p-6 text-sm text-foreground-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="m-6 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            {emptyLabel}
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Application history">
                <Table.Header>
                  <Table.Column isRowHeader>{renderSortButton('title', 'Role')}</Table.Column>
                  <Table.Column>{renderSortButton('company', 'Company')}</Table.Column>
                  <Table.Column>{renderSortButton('status', 'Status')}</Table.Column>
                  <Table.Column>{renderSortButton('createdAt', 'Applied')}</Table.Column>
                  <Table.Column>{renderSortButton('updatedAt', 'Updated')}</Table.Column>
                  <Table.Column>{renderSortButton('expiresAt', 'Expires')}</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {applications.map((application) => (
                    <Table.Row key={application.id} id={application.id}>
                      <Table.Cell>
                        <span className="font-medium text-foreground">
                          {application.jobPosting.title || 'Untitled role'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-foreground-500">{application.jobPosting.company.name}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="rounded-md"
                          color={getStatusColor(application.status)}
                          size="sm"
                          variant="soft"
                        >
                          {getStatusLabel(application.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(application.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(application.updatedAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {application.jobPosting.expiresAt
                            ? formatDate(application.jobPosting.expiresAt)
                            : 'No expiry'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Dropdown.Trigger
                            aria-label={`${application.jobPosting.title || 'Application'} actions`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 text-foreground transition-colors hover:bg-content2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover placement="bottom end">
                            <Dropdown.Menu aria-label={`${application.jobPosting.title || 'Application'} actions`}>
                              <Dropdown.Item
                                href={`/panel/applications/${application.id}`}
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
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
            <span className="text-sm text-foreground-500">
              Page {currentPage} of {totalPages}
              {totalItems > 0 ? ` · ${totalItems} total` : ''}
            </span>
            <Button
              isIconOnly
              aria-label="Previous page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => updateQuery({ page: Math.max(1, currentPage - 1) })}
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
              onPress={() => updateQuery({ page: Math.min(totalPages, currentPage + 1) })}
              isDisabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};
