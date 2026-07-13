import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Chip, Dropdown, Input, ListBox, Select, Table, toast } from '@heroui/react';
import { Ban, ChevronLeft, ChevronRight, MoreHorizontal, PanelTopOpen, RotateCcw, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getAdminUsers, updateAdminUserStatus, type AdminUser } from '../lib/admin-api';
import { authSessionAtom } from '../store/auth';
import { getApiBaseUrl } from '../lib/http';
import { StatusMultiSelect } from '../components/StatusMultiSelect';

const pageSize = 20;

const getSearchQuery = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length >= 3 ? trimmed : '';
};

const formatRole = (role: string) => role === 'Admin' ? 'Administrator' : role;

const getRoleColor = (role: string): 'accent' | 'default' | 'warning' => {
  if (role === 'Admin') return 'accent';
  if (role === 'Recruiter') return 'warning';
  return 'default';
};

const resolveAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) return undefined;
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;
  const baseUrl = getApiBaseUrl();
  return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${assetUrl}` : new URL(assetUrl, baseUrl).toString();
};

export const AdminUsersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAtomValue(authSessionAtom);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatusUser, setPendingStatusUser] = useState<AdminUser | null>(null);
  const [statusActioning, setStatusActioning] = useState(false);
  const hasFilters = searchDraft.trim().length > 0 || search.length > 0 || role !== '' || statuses.length > 0;

  const query = useMemo(() => ({
    page,
    limit: pageSize,
    search: search || undefined,
    role: role || undefined,
    isDeleted: statuses.length === 1 ? statuses[0] === 'Disabled' : undefined,
    sort: 'desc',
    orderBy: 'createdAt',
  }), [page, role, search, statuses]);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAdminUsers(query);
        if (!mounted) return;
        setUsers(response.data);
        setPage(response.pagination?.currentPage ?? page);
        setTotalPages(response.pagination?.totalPages ?? 1);
      } catch (cause) {
        if (!mounted) return;
        setUsers([]);
        setError(cause instanceof Error ? cause.message : 'Unable to load users.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadUsers();
    return () => { mounted = false; };
  }, [page, query]);

  useEffect(() => {
    const nextSearch = getSearchQuery(searchDraft);
    if (nextSearch === search) return;

    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(nextSearch);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, searchDraft]);

  const clearFilters = () => {
    setPage(1);
    setSearchDraft('');
    setSearch('');
    setRole('');
    setStatuses([]);
  };

  const updateStatus = async () => {
    if (!pendingStatusUser) return;

    const nextStatus = pendingStatusUser.isDeleted ? 'Active' : 'Disabled';
    setStatusActioning(true);
    setError(null);

    try {
      const response = await updateAdminUserStatus(pendingStatusUser.id, nextStatus);
      const shouldRemainVisible = statuses.length === 0 || statuses.includes(nextStatus);
      setUsers((current) => shouldRemainVisible
        ? current.map((user) => user.id === response.data.id ? response.data : user)
        : current.filter((user) => user.id !== response.data.id));
      setPendingStatusUser(null);
      toast.success(`Account ${nextStatus === 'Active' ? 'restored' : 'disabled'}.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to update account status.';
      setError(message);
      toast.danger('Unable to update account status', { description: message });
    } finally {
      setStatusActioning(false);
    }
  };

  return (
    <div className="grid gap-8">
      <ConfirmDialog
        open={Boolean(pendingStatusUser)}
        title={pendingStatusUser?.isDeleted ? 'Restore this account?' : 'Disable this account?'}
        description={pendingStatusUser?.isDeleted
          ? `${pendingStatusUser.name} will regain access to the platform.`
          : `${pendingStatusUser?.name ?? 'This user'} will immediately lose access to protected areas.`}
        confirmLabel={pendingStatusUser?.isDeleted ? 'Restore account' : 'Disable account'}
        confirmTone={pendingStatusUser?.isDeleted ? 'primary' : 'danger'}
        loading={statusActioning}
        onCancel={() => setPendingStatusUser(null)}
        onConfirm={() => void updateStatus()}
      />
      <section className="p-0">
        <h2 className="text-4xl leading-[1.15] text-foreground">Users</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
          Review registered accounts, profile information, and access status.
        </p>

        <form
          className="mt-7 grid gap-3 lg:grid-cols-[minmax(350px,1.25fr)_220px_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(getSearchQuery(searchDraft));
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search users</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500" />
            <Input
              aria-label="Search users"
              className="h-10 rounded-lg pl-9 text-sm w-100"
              placeholder="Search by name or email"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>

          <Select selectedKey={role || 'all'} onSelectionChange={(key) => {
            setPage(1);
            setRole(key && String(key) !== 'all' ? String(key) : '');
          }}>
            <Select.Trigger aria-label="Role" className="h-10 rounded-lg text-sm">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox aria-label="Role options">
                <ListBox.Item id="all" textValue="All roles">All roles</ListBox.Item>
                <ListBox.Item id="Candidate" textValue="Candidate">Candidate</ListBox.Item>
                <ListBox.Item id="Recruiter" textValue="Recruiter">Recruiter</ListBox.Item>
                <ListBox.Item id="Admin" textValue="Administrator">Administrator</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

          <StatusMultiSelect
            ariaLabel="Filter users by status"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Disabled', label: 'Disabled' },
            ]}
            selectedValues={statuses}
            onChange={(values) => {
              setPage(1);
              setStatuses(values.length === 2 ? [] : values);
            }}
          />

          <Button isIconOnly aria-label="Clear filters" className="h-10 w-10 rounded-lg" type="button" variant="outline" isDisabled={!hasFilters} onPress={clearFilters}>
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </form>

        {error && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">{error}</div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-divider bg-content1">
        {loading ? (
          <div className="p-6 text-sm text-foreground-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="m-6 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No users match the selected filters.
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Users">
                <Table.Header>
                  <Table.Column isRowHeader>User</Table.Column>
                  <Table.Column>Role</Table.Column>
                  <Table.Column>Company</Table.Column>
                  <Table.Column>Verified</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {users.map((user) => (
                    <Table.Row key={user.id} id={user.id}>
                      <Table.Cell>
                        <div className="flex min-w-64 items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-divider !bg-content2">
                            {user.image && (
                              <Avatar.Image alt="" className="h-full w-full object-cover" src={resolveAssetUrl(user.image)} />
                            )}
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-content2 text-xs font-semibold text-foreground" delayMs={0}>
                              {`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{user.name}</div>
                            <div className="mt-1 max-w-72 truncate text-sm text-foreground-500">{user.email}</div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip className="whitespace-nowrap rounded-md" color={getRoleColor(user.role)} size="sm" variant="soft">
                          {formatRole(user.role)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell><span className="text-foreground-500">{user.company?.name ?? 'Not assigned'}</span></Table.Cell>
                      <Table.Cell><span className="text-foreground-500">{user.emailVerified ? 'Yes' : 'No'}</span></Table.Cell>
                      <Table.Cell>
                        <Chip className="rounded-md" color={user.isDeleted ? 'danger' : 'success'} size="sm" variant="soft">
                          {user.isDeleted ? 'Disabled' : 'Active'}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        {session?.user.id !== user.id && (
                          <Dropdown>
                            <Dropdown.Trigger
                              aria-label={`${user.name} actions`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 text-foreground transition-colors hover:bg-content2"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Dropdown.Trigger>
                            <Dropdown.Popover placement="bottom end">
                              <Dropdown.Menu aria-label={`${user.name} actions`}>
                                <Dropdown.Item
                                  textValue="Open details"
                                  onPress={() => navigate(`/panel/admin/users/${user.id}`, {
                                    state: { user, backTo: `${location.pathname}${location.search}` },
                                  })}
                                >
                                  <span className="inline-flex w-full items-center gap-2">
                                    <PanelTopOpen className="h-4 w-4" />
                                    Open details
                                  </span>
                                </Dropdown.Item>
                                <Dropdown.Item
                                  textValue={user.isDeleted ? 'Restore account' : 'Disable account'}
                                  onPress={() => setPendingStatusUser(user)}
                                >
                                  <span className={`inline-flex w-full items-center gap-2 ${user.isDeleted ? 'text-foreground' : 'text-danger-700'}`}>
                                    {user.isDeleted ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                    {user.isDeleted ? 'Restore account' : 'Disable account'}
                                  </span>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown>
                        )}
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
            <span className="text-sm text-foreground-500">Page {page} of {totalPages}</span>
            <Button isIconOnly aria-label="Previous page" type="button" variant="outline" size="sm" onPress={() => setPage((value) => Math.max(1, value - 1))} isDisabled={loading || page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button isIconOnly aria-label="Next page" type="button" variant="outline" size="sm" onPress={() => setPage((value) => Math.min(totalPages, value + 1))} isDisabled={loading || page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};
