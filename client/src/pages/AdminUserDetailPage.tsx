import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Chip, Input, toast } from '@heroui/react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { ArrowLeft, Pencil } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getAdminUser, updateAdminUser, updateAdminUserStatus, type AdminUser } from '../lib/admin-api';
import { getApiBaseUrl } from '../lib/http';
import { authSessionAtom } from '../store/auth';

const formatDate = (value: string | null | undefined, fallback = 'Not provided') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(date)
    .replace(/\//g, '.');
};

const formatRole = (role: string) => role === 'Admin' ? 'Administrator' : role;

const formatOnboardingStatus = (status: string) => status.replace(/([a-z])([A-Z])/g, '$1 $2');

const resolveAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) return undefined;
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;
  const baseUrl = getApiBaseUrl();
  return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${assetUrl}` : new URL(assetUrl, baseUrl).toString();
};

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-divider bg-content2 px-4 py-3.5">
    <dt className="text-xs font-medium uppercase tracking-[0.06em] text-foreground-500">{label}</dt>
    <dd className="mt-1.5 break-words text-sm font-medium text-foreground">{children}</dd>
  </div>
);

export const AdminUserDetailPage = () => {
  const { id = '' } = useParams();
  const location = useLocation();
  const session = useAtomValue(authSessionAtom);
  const locationState = location.state as { user?: AdminUser; backTo?: string } | null;
  const initialUser = locationState?.user ?? null;
  const backTo = locationState?.backTo?.startsWith('/') ? locationState.backTo : '/panel/admin/users';
  const [user, setUser] = useState<AdminUser | null>(initialUser);
  const [form, setForm] = useState({ firstName: initialUser?.firstName ?? '', lastName: initialUser?.lastName ?? '', email: initialUser?.email ?? '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(!initialUser);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrl = useMemo(() => resolveAssetUrl(user?.image), [user?.image]);

  const setUserAndForm = (nextUser: AdminUser) => {
    setUser(nextUser);
    setForm({ firstName: nextUser.firstName, lastName: nextUser.lastName, email: nextUser.email });
  };

  const load = async () => {
    if (session?.user.id === id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUser(id);
      setUserAndForm(response.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session?.user.id]);

  const cancelEditing = () => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await updateAdminUser(id, form);
      setUserAndForm(response.data);
      setEditing(false);
      toast.success('User updated.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to update user.';
      setError(message);
      toast.danger(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const response = await updateAdminUserStatus(id, user.isDeleted ? 'Active' : 'Disabled');
      setUserAndForm(response.data);
      setConfirmOpen(false);
      toast.success(`Account ${user.isDeleted ? 'restored' : 'disabled'}.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to update status.';
      setError(message);
      toast.danger(message);
    } finally {
      setSaving(false);
    }
  };

  if (session?.user.id === id) {
    return <Navigate to="/panel/admin/users" replace />;
  }

  if (loading) {
    return <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">Loading user...</section>;
  }

  if (!user) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error ?? 'User not found.'}</div>
        <div className="mt-4 flex gap-3">
          <Button variant="primary" onPress={() => void load()}>Retry</Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to={backTo}>Back</Link>
        </div>
      </section>
    );
  }

  const isSelf = session?.user.id === user.id;
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="grid gap-8">
      <ConfirmDialog
        open={confirmOpen}
        title={user.isDeleted ? 'Restore this account?' : 'Disable this account?'}
        description={user.isDeleted ? 'The user will regain access to the platform.' : 'The user will immediately lose access to protected areas.'}
        confirmLabel={user.isDeleted ? 'Restore account' : 'Disable account'}
        confirmTone={user.isDeleted ? 'primary' : 'danger'}
        loading={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void toggleStatus()}
      />

      <section>
        <Link className="inline-flex items-center gap-2 text-sm text-foreground-500 hover:text-foreground" to={backTo}>
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-divider !bg-content2">
              {imageUrl && <Avatar.Image alt="" className="h-full w-full object-cover" src={imageUrl} />}
              <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-content2 text-sm font-semibold text-foreground" delayMs={0}>
                {initials}
              </Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-4xl leading-[1.15] text-foreground">{user.name}</h1>
              <p className="mt-2 truncate text-sm text-foreground-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Chip className="rounded-md" color={user.isDeleted ? 'danger' : 'success'} size="sm" variant="soft">
              {user.isDeleted ? 'Disabled' : 'Active'}
            </Chip>
            {!editing && (
              <Button variant="outline" onPress={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit profile
              </Button>
            )}
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl text-foreground">Profile details</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-500">
              {editing ? 'Update the user’s personal and contact information.' : 'Personal and contact information associated with this account.'}
            </p>
          </div>

          {editing ? (
            <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  First name
                  <Input aria-label="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Last name
                  <Input aria-label="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Email address
                <Input aria-label="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <div className="flex flex-wrap justify-end gap-3 border-t border-divider pt-5">
                <Button type="button" variant="outline" isDisabled={saving} onPress={cancelEditing}>Cancel</Button>
                <Button type="submit" variant="primary" isDisabled={saving || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="First name">{user.firstName}</Detail>
              <Detail label="Last name">{user.lastName}</Detail>
              <Detail label="Email address">{user.email}</Detail>
              <Detail label="Date of birth">{formatDate(user.dateOfBirth)}</Detail>
              <Detail label="Email verified">{user.emailVerified ? 'Verified' : 'Not verified'}</Detail>
              <Detail label="User ID"><span className="font-mono text-xs">{user.id}</span></Detail>
            </dl>
          )}
        </section>

        <div className="grid content-start gap-6">
          <section className="rounded-xl border border-divider bg-content1 p-6">
            <h2 className="text-2xl text-foreground">Account details</h2>
            <dl className="mt-5 grid gap-3">
              <Detail label="Role">{formatRole(user.role)}</Detail>
              <Detail label="Company">{user.company?.name ?? 'Not assigned'}</Detail>
              <Detail label="Onboarding status">{formatOnboardingStatus(user.onboardingStatus)}</Detail>
              <Detail label="Registered">{formatDate(user.createdAt)}</Detail>
              <Detail label="Last updated">{formatDate(user.updatedAt)}</Detail>
            </dl>
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6">
            <h2 className="text-xl text-foreground">Account access</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-500">
              {user.isDeleted ? 'This account is disabled and cannot access protected areas.' : 'This account is active and can access the platform.'}
            </p>
            <Button className="mt-5 w-full" variant={user.isDeleted ? 'outline' : 'danger'} isDisabled={saving || (isSelf && !user.isDeleted)} onPress={() => setConfirmOpen(true)}>
              {user.isDeleted ? 'Restore account' : 'Disable account'}
            </Button>
            {isSelf && !user.isDeleted && <p className="mt-3 text-xs leading-5 text-foreground-500">You cannot disable your own account.</p>}
          </section>
        </div>
      </div>
    </div>
  );
};
