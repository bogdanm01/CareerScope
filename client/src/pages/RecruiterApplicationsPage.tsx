import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useSearchParams } from 'react-router-dom';
import { Avatar, Button, Chip, ComboBox, Dropdown, Input, ListBox, Table } from '@heroui/react';
import { ChevronLeft, ChevronRight, MoreHorizontal, PanelTopOpen, Search } from 'lucide-react';
import { getRecruiterJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { getRecruiterJobApplications, type RecruiterJobApplicationListItem } from '../lib/job-applications-api';
import { formatDate } from '../lib/date-format';
import { authSessionAtom } from '../store/auth';
import { StatusMultiSelect } from '../components/StatusMultiSelect';
import { useRecruiterPostingAccess } from '../hooks/useRecruiterPostingAccess';
import { CompanyApprovalRequiredCard } from '../components/CompanyApprovalRequiredCard';

type ApplicationRow = RecruiterJobApplicationListItem & {
  postingTitle: string;
  postingCompanyId: number | null;
};

const allPostingsKey = 'all';
const allCompaniesKey = 'all';
const pageSize = 10;

const formatStatus = (status: string) => (status === 'UnderReview' ? 'Under Review' : status);

const getStatusColor = (status: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
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

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '??';

export const RecruiterApplicationsPage = () => {
  const session = useAtomValue(authSessionAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = session?.user.role === 'Admin';
  const {
    company: recruiterCompany,
    loading: companyApprovalLoading,
    error: companyApprovalError,
    isBlocked: recruiterApplicationsBlocked,
  } = useRecruiterPostingAccess(!isAdmin);
  const selectedPostingKey = searchParams.get('postingId') || allPostingsKey;
  const selectedCompanyKey = isAdmin ? searchParams.get('companyId') || allCompaniesKey : allCompaniesKey;
  const selectedStatusKeys = useMemo(
    () => searchParams.getAll('status').filter((status) => status !== 'all'),
    [searchParams],
  );

  useEffect(() => {
    if (!isAdmin && (companyApprovalLoading || recruiterApplicationsBlocked)) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const postingsResponse = await getRecruiterJobPostings();

        if (!isMounted) {
          return;
        }

        const loadedPostings = postingsResponse.data;
        setPostings(loadedPostings);

        const applicationResponses = await Promise.allSettled(
          loadedPostings.map(async (posting) => {
            const response = await getRecruiterJobApplications(posting.id);
            return response.data.map((application) => ({
              ...application,
              postingTitle: posting.title || `Posting #${posting.id}`,
              postingCompanyId: posting.company?.id ?? null,
            }));
          }),
        );

        if (!isMounted) {
          return;
        }

        setApplications(
          applicationResponses.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
        );
      } catch {
        if (isMounted) {
          setPostings([]);
          setApplications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [companyApprovalLoading, isAdmin, recruiterApplicationsBlocked]);

  const statuses = useMemo(
    () => Array.from(new Set(applications.map((application) => application.status))).sort(),
    [applications],
  );

  const companies = useMemo(() => {
    const byId = new Map<number, NonNullable<JobPostingListItem['company']>>();
    postings.forEach((posting) => {
      if (posting.company) {
        byId.set(posting.company.id, posting.company);
      }
    });
    return Array.from(byId.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [postings]);

  const visiblePostings = useMemo(
    () =>
      postings.filter(
        (posting) =>
          selectedCompanyKey === allCompaniesKey || String(posting.company?.id) === selectedCompanyKey,
      ),
    [postings, selectedCompanyKey],
  );

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications
      .filter((application) => {
        if (selectedPostingKey !== allPostingsKey && String(application.jobPostingId) !== selectedPostingKey) {
          return false;
        }

        if (
          isAdmin &&
          selectedCompanyKey !== allCompaniesKey &&
          String(application.postingCompanyId) !== selectedCompanyKey
        ) {
          return false;
        }

        if (selectedStatusKeys.length > 0 && !selectedStatusKeys.includes(application.status)) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          application.user.fullName.toLowerCase().includes(normalizedSearch) ||
          application.user.email.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [applications, isAdmin, search, selectedCompanyKey, selectedPostingKey, selectedStatusKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const paginatedApplications = useMemo(
    () => filteredApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredApplications, currentPage],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentPage((page) => Math.min(page, totalPages));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [totalPages]);

  const updateFilters = (updates: { companyId?: string; postingId?: string; status?: string[]; search?: string }) => {
    const next = new URLSearchParams(searchParams);
    if (!isAdmin) {
      next.delete('companyId');
    }
    setCurrentPage(1);

    if (isAdmin && updates.companyId !== undefined) {
      if (!updates.companyId || updates.companyId === allCompaniesKey) {
        next.delete('companyId');
      } else {
        next.set('companyId', updates.companyId);
      }
    }

    if (updates.postingId !== undefined) {
      if (!updates.postingId || updates.postingId === allPostingsKey) {
        next.delete('postingId');
      } else {
        next.set('postingId', updates.postingId);
      }
    }

    if (updates.status !== undefined) {
      next.delete('status');
      updates.status.forEach((status) => next.append('status', status));
    }

    if (updates.search !== undefined) {
      if (!updates.search.trim()) {
        next.delete('search');
      } else {
        next.set('search', updates.search.trim());
      }
    }

    setSearchParams(next);
  };

  return (
    <div className="grid gap-6">
      <section>
        <div>
          <h2 className="text-4xl leading-[1.15] text-foreground">
            Applications
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-500">
            {isAdmin ? 'Review applicants across company job postings.' : 'Review applicants across your job postings.'}
          </p>
        </div>
      </section>

      {!isAdmin && companyApprovalLoading ? (
        <div className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500">
          Checking company approval...
        </div>
      ) : recruiterApplicationsBlocked ? (
        <CompanyApprovalRequiredCard
          area="applications"
          company={recruiterCompany}
          verificationError={companyApprovalError}
        />
      ) : (
        <>
      <section
        className={`grid gap-3 md:grid-cols-2 ${
          isAdmin
            ? 'xl:grid-cols-[400px_220px_minmax(280px,1fr)_200px]'
            : 'xl:grid-cols-[400px_minmax(280px,1fr)_200px]'
        }`}
      >
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              updateFilters({ search: event.target.value });
            }}
            placeholder="Search applicants"
            className="h-10 w-100 pl-9 text-sm"
          />
        </div>

        {isAdmin && (
          <ComboBox
            selectedKey={selectedCompanyKey}
            onSelectionChange={(key) =>
              updateFilters({
                companyId: key ? String(key) : allCompaniesKey,
                postingId: allPostingsKey,
              })
            }
            fullWidth
          >
            <ComboBox.InputGroup className="flex h-10 items-center">
              <Input aria-label="Filter by company" className="!text-sm !font-medium" placeholder="Search companies" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox aria-label="Companies" className="max-h-64 overflow-auto py-1">
                <ListBox.Item id={allCompaniesKey} textValue="All companies">
                  All companies
                </ListBox.Item>
                {companies.map((company) => (
                  <ListBox.Item key={company.id} id={String(company.id)} textValue={company.name}>
                    {company.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        )}

        <ComboBox
          selectedKey={selectedPostingKey}
          onSelectionChange={(key) => updateFilters({ postingId: key ? String(key) : allPostingsKey })}
          fullWidth
        >
          <ComboBox.InputGroup className="flex h-10 items-center">
            <Input aria-label="Filter by job posting" className="!text-sm !font-medium" placeholder="Search postings" />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox aria-label="Job postings" className="max-h-64 overflow-auto py-1">
              <ListBox.Item id={allPostingsKey} textValue="All postings">
                All postings
              </ListBox.Item>
              {visiblePostings.map((posting) => (
                <ListBox.Item key={posting.id} id={String(posting.id)} textValue={posting.title || `Posting #${posting.id}`}>
                  <div className="grid gap-0.5">
                    <span>{posting.title || `Posting #${posting.id}`}</span>
                    {isAdmin && posting.company && (
                      <span className="text-xs text-foreground-500">{posting.company.name}</span>
                    )}
                  </div>
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        <StatusMultiSelect
          ariaLabel="Filter applications by status"
          options={statuses.map((status) => ({ value: status, label: formatStatus(status) }))}
          selectedValues={selectedStatusKeys}
          onChange={(values) => updateFilters({ status: values.length === statuses.length ? [] : values })}
        />
      </section>

      <section className="rounded-xl border border-divider bg-content1">
        {loading ? (
          <div className="p-6 text-sm text-foreground-500">Loading applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="m-6 rounded-lg border border-dashed border-divider bg-content2/50 p-6 text-sm text-foreground-500">
            No applications found.
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Job applications">
                <Table.Header>
                  <Table.Column>Applicant</Table.Column>
                  <Table.Column>Job posting</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Applied</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {paginatedApplications.map((application) => (
                    <Table.Row key={application.id} id={application.id}>
                      <Table.Cell>
                        <div className="flex min-w-72 items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-divider !bg-content2">
                            {application.user.image && (
                              <Avatar.Image
                                alt={`${application.user.fullName} avatar`}
                                className="h-full w-full object-cover"
                                src={application.user.image}
                              />
                            )}
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-content2 text-sm font-semibold text-foreground" delayMs={0}>
                              {getInitials(application.user.fullName)}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-foreground">{application.user.fullName}</div>
                            <div className="truncate text-sm text-foreground-500" title={application.user.email}>
                              {application.user.email}
                            </div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="block max-w-72 truncate font-medium text-foreground-600" title={application.postingTitle}>
                          {application.postingTitle}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="whitespace-nowrap rounded-md"
                          color={getStatusColor(application.status)}
                          size="sm"
                          variant="soft"
                        >
                          {formatStatus(application.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(application.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Dropdown.Trigger
                            aria-label={`${application.user.fullName} application actions`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 text-foreground transition-colors hover:bg-content2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover placement="bottom end">
                            <Dropdown.Menu aria-label={`${application.user.fullName} application actions`}>
                              <Dropdown.Item
                                href={`/panel/job-applications/${application.id}`}
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
          <div className="mt-5 flex items-center justify-end gap-3 px-6 pb-6">
            <span className="text-sm text-foreground-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              isIconOnly
              aria-label="Previous page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
              onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              isDisabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
