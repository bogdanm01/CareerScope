import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  Input,
  ListBox,
  Select,
  Table,
  Tabs,
} from "@heroui/react";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  PanelTopOpen,
  Search,
  X,
} from "lucide-react";
import { getAdminCompanies, type AdminCompanyListItem } from "../lib/admin-api";
import { getCompanyLogoUrl } from "../lib/company-logo";
import { StatusMultiSelect } from "../components/StatusMultiSelect";
import { AdminCompanyApprovalsPage } from "./AdminCompanyApprovalsPage";

const pageSize = 10;

const formatDotDate = (
  value: string | null | undefined,
  fallback = "Not approved",
) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, ".");
};

const formatApprovalStatus = (status: string) => {
  switch (status) {
    case "PendingApproval":
      return "Pending approval";
    default:
      return status;
  }
};

const getApprovalColor = (
  status: string,
): "accent" | "danger" | "default" | "success" | "warning" => {
  switch (status) {
    case "Approved":
      return "success";
    case "Rejected":
      return "danger";
    case "PendingApproval":
      return "warning";
    default:
      return "default";
  }
};

const optionalBoolean = (value: string) =>
  value === "true" ? true : value === "false" ? false : undefined;
const getSearchQuery = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length >= 3 ? trimmed : "";
};

export const AdminCompaniesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab") === "approvals" ? "approvals" : "all";
  const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [approvalStatuses, setApprovalStatuses] = useState<string[]>([]);
  const [deletedFilter, setDeletedFilter] = useState("false");
  const hasNonDefaultFilters =
    searchDraft.trim().length > 0 ||
    search.length > 0 ||
    approvalStatuses.length > 0 ||
    deletedFilter !== "false";

  const query = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: search.trim() || undefined,
      approvalStatus: approvalStatuses.length > 0 ? approvalStatuses.join(",") : undefined,
      isDeleted: optionalBoolean(deletedFilter),
      sort: "desc",
      orderBy: "id",
    }),
    [approvalStatuses, currentPage, deletedFilter, search],
  );

  useEffect(() => {
    let isMounted = true;

    const loadCompanies = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAdminCompanies(query);

        if (!isMounted) {
          return;
        }

        setCompanies(response.data);
        setCurrentPage(response.pagination?.currentPage ?? currentPage);
        setTotalPages(response.pagination?.totalPages ?? 1);
      } catch (loadError) {
        if (isMounted) {
          setCompanies([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load companies",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      isMounted = false;
    };
  }, [currentPage, query]);

  useEffect(() => {
    const nextSearch = getSearchQuery(searchDraft);

    if (nextSearch === search) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setSearch(nextSearch);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, searchDraft]);

  const applySearchImmediately = () => {
    setCurrentPage(1);
    setSearch(getSearchQuery(searchDraft));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchDraft("");
    setSearch("");
    setApprovalStatuses([]);
    setDeletedFilter("false");
  };
  const publicCompanyBackTo = encodeURIComponent(
    `${location.pathname}${location.search}`,
  );
  const handleTabChange = (key: React.Key) => {
    const nextTab = key === "approvals" ? "approvals" : "all";
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="grid gap-8">
      <section className="p-0">
        <h2 className="text-4xl leading-[1.15] text-foreground">
          Companies
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
          Browse registered companies or review pending approval requests.
        </p>
      </section>

      <Tabs className="w-full" selectedKey={selectedTab} onSelectionChange={handleTabChange}>
        <Tabs.ListContainer className="max-w-md">
          <Tabs.List aria-label="Admin company views">
            <Tabs.Tab id="all">
              All companies
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="approvals">
              Approvals
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id={selectedTab} className="w-full pt-4">
          {selectedTab === "all" ? (
            <div className="grid gap-8">
              <div>
                <form
                  className="grid gap-3 lg:grid-cols-[minmax(350px,1.25fr)_220px_180px_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    applySearchImmediately();
                  }}
                >
                  <label className="relative block">
                    <span className="sr-only">Search companies</span>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500"
                    />
                    <Input
                      aria-label="Search companies"
                      className="h-10 w-100 rounded-lg pl-9 text-sm"
                      placeholder="Search by company name or tax ID"
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                    />
                  </label>

                  <StatusMultiSelect
                    ariaLabel="Filter companies by approval status"
                    options={[
                      { value: "PendingApproval", label: "Pending approval" },
                      { value: "Approved", label: "Approved" },
                      { value: "Rejected", label: "Rejected" },
                    ]}
                    selectedValues={approvalStatuses}
                    onChange={(values) => {
                      setCurrentPage(1);
                      setApprovalStatuses(values.length === 3 ? [] : values);
                    }}
                  />

                  <Select
                    selectedKey={deletedFilter || "all"}
                    onSelectionChange={(key) => {
                      setCurrentPage(1);
                      setDeletedFilter(
                        key && String(key) !== "all" ? String(key) : "",
                      );
                    }}
                  >
                    <Select.Trigger
                      aria-label="Deleted filter"
                      className="h-10 rounded-lg text-sm"
                    >
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox aria-label="Deleted filter options">
                        <ListBox.Item id="all" textValue="All records">
                          All records
                        </ListBox.Item>
                        <ListBox.Item id="false" textValue="Active records">
                          Active records
                        </ListBox.Item>
                        <ListBox.Item id="true" textValue="Deleted records">
                          Deleted records
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Button
                    isIconOnly
                    aria-label="Clear filters"
                    className="h-10 w-10 rounded-lg text-sm"
                    type="button"
                    variant="outline"
                    isDisabled={!hasNonDefaultFilters}
                    onPress={clearFilters}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </form>

                {error && (
                  <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
                    {error}
                  </div>
                )}
              </div>

      <section className="overflow-hidden rounded-xl border border-divider bg-content1">
        {loading ? (
          <div className="p-6 text-sm text-foreground-500">
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="m-6 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No companies found.
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Companies">
                <Table.Header>
                  <Table.Column isRowHeader>Company</Table.Column>
                  <Table.Column>Tax ID</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Employees</Table.Column>
                  <Table.Column>Website</Table.Column>
                  <Table.Column>Approved at</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {companies.map((company) => (
                    <Table.Row key={company.id} id={company.id}>
                      <Table.Cell>
                        <div className="flex min-w-72 items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-divider !bg-content2">
                            {getCompanyLogoUrl(company.logoUrl, company.websiteUrl) && (
                              <Avatar.Image
                                alt={`${company.name} logo`}
                                className="h-full w-full bg-white object-contain p-1.5"
                                src={getCompanyLogoUrl(company.logoUrl, company.websiteUrl) ?? undefined}
                              />
                            )}
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-content2 text-sm font-semibold text-foreground" delayMs={0}>
                              {company.name.trim().charAt(0).toUpperCase() || '?'}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {company.name}
                            </div>
                            <div className="mt-1 max-w-80 truncate text-sm text-foreground-500">
                              {company.shortDescription ||
                                company.address ||
                                "No description provided."}
                            </div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {company.taxId}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="rounded-md"
                          color={getApprovalColor(company.approvalStatus)}
                          size="sm"
                          variant="soft"
                        >
                          {formatApprovalStatus(company.approvalStatus)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {company.numberOfEmployees ?? "Not provided"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {company.websiteUrl ? (
                          <a
                            className="block max-w-56 truncate text-foreground underline decoration-divider underline-offset-4"
                            href={company.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {company.websiteUrl}
                          </a>
                        ) : (
                          <span className="text-foreground-500">
                            Not provided
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDotDate(company.approvedAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Dropdown.Trigger
                            aria-label={`Company ${company.id} actions`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 text-foreground transition-colors hover:bg-content2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover placement="bottom end">
                            <Dropdown.Menu
                              aria-label={`Company ${company.id} actions`}
                            >
                              <Dropdown.Item
                                textValue="Open details"
                                onPress={() =>
                                  navigate(
                                    `/panel/admin/companies/${company.id}`,
                                    {
                                      state: {
                                        company,
                                        backTo: `${location.pathname}${location.search}`,
                                      },
                                    },
                                  )
                                }
                              >
                                <span className="inline-flex w-full items-center gap-2">
                                  <PanelTopOpen className="h-4 w-4" />
                                  Open details
                                </span>
                              </Dropdown.Item>
                              <Dropdown.Item
                                textValue="View job postings"
                                onPress={() =>
                                  navigate(
                                    `/panel/admin/job-postings?tab=all&companyId=${company.id}`,
                                  )
                                }
                              >
                                <span className="inline-flex w-full items-center gap-2">
                                  <BriefcaseBusiness className="h-4 w-4" />
                                  View job postings
                                </span>
                              </Dropdown.Item>
                              <Dropdown.Item
                                isDisabled={!company.isApproved}
                                href={
                                  company.isApproved
                                    ? `/companies/${company.id}?backTo=${publicCompanyBackTo}`
                                    : undefined
                                }
                                target={
                                  company.isApproved ? "_blank" : undefined
                                }
                                textValue="Open public page"
                              >
                                <span
                                  className="inline-flex items-center gap-2"
                                  title={
                                    company.isApproved
                                      ? undefined
                                      : "Company must be approved first"
                                  }
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open public page
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
              onPress={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              isDisabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
            </div>
          ) : (
            <AdminCompanyApprovalsPage embedded />
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};
