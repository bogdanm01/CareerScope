import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Dropdown, Table } from '@heroui/react';
import { ChevronLeft, ChevronRight, MoreHorizontal, PanelTopOpen } from 'lucide-react';
import {
  getAdminCompanies,
  type AdminCompanyListItem,
} from '../lib/admin-api';

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

export const AdminCompanyApprovalsPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 5;

  const loadRequests = async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminCompanies({
        approvalStatus: 'PendingApproval',
        isDeleted: false,
        page,
        limit: pageSize,
        sort: 'desc',
        orderBy: 'id',
      });
      setCompanies(response.data);
      setCurrentPage(response.pagination?.currentPage ?? page);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (loadError) {
      setCompanies([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load company approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-8">
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl leading-[1.15] text-foreground">Company approvals</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review pending recruiter companies and approve the ones ready to join the platform.
            </p>
          </div>
        </div>

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
              isIconOnly
              aria-label="Previous page"
              type="button"
              variant="outline"
              size="sm"
              onPress={() => void loadRequests(Math.max(1, currentPage - 1))}
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
              onPress={() => void loadRequests(Math.min(totalPages, currentPage + 1))}
              isDisabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading company approvals...
          </div>
        ) : companies.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No pending company approvals.
          </div>
        ) : (
          <Table className="mt-5" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Pending company approvals">
                <Table.Header>
                  <Table.Column isRowHeader>ID</Table.Column>
                  <Table.Column>Company</Table.Column>
                  <Table.Column>Tax ID</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Action</Table.Column>
                </Table.Header>
                <Table.Body>
                  {companies.map((company) => (
                    <Table.Row key={company.id} id={company.id}>
                      <Table.Cell>
                        <span className="whitespace-nowrap font-medium text-foreground">#{company.id}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="min-w-56">
                          <div className="font-medium text-foreground">{company.name}</div>
                          <div className="mt-1 max-w-80 truncate text-sm text-foreground-500">
                            {company.shortDescription || company.address || 'No description provided.'}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">{company.taxId}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip className="whitespace-nowrap rounded-md" color={getApprovalColor(company.approvalStatus)} size="sm" variant="soft">
                          {formatApprovalStatus(company.approvalStatus)}
                        </Chip>
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
                            <Dropdown.Menu aria-label={`Company ${company.id} actions`}>
                              <Dropdown.Item
                                textValue="Open details"
                                onPress={() => navigate(`/panel/admin/companies/${company.id}`, {
                                  state: { company, backTo: '/panel/admin/company-approvals' },
                                })}
                              >
                                <span className="inline-flex w-full items-center gap-2">
                                  <PanelTopOpen className="h-4 w-4" />
                                  Open details
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
