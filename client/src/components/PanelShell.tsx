import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@heroui/react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { authSessionAtom, signOutAtom } from '../store/auth';
import { useAppTheme } from './ThemeContext';
import { getApiBaseUrl } from '../lib/http';

type PanelNavItem = {
  to: string;
  label: string;
  icon: 'dashboard' | 'analytics' | 'profile' | 'jobs' | 'applications' | 'companies' | 'postings' | 'approvals';
};

const navIconPath = {
  dashboard: 'M4 12.5 12 4l8 8.5V20H4z M10 20v-6h4v6',
  analytics: 'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7m4 7v-3',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z',
  jobs: 'M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5zM8 10h8M8 13h5',
  applications: 'M7 4h10v16H7zm2 4h6M9 12h6M9 15h4',
  companies: 'M6 20V7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5V20m-5 0v-4h-2v4M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01',
  postings: 'M5 6h14M5 10h14M5 14h9M5 18h6',
  approvals: 'M9 12.5 11 14.5 15.5 9.5M5 6h14M5 18h14M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
} as const;

const NavGlyph = ({ name }: { name: PanelNavItem['icon'] }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.25 w-4.25 shrink-0 fill-none stroke-current stroke-[1.75]">
    <path d={navIconPath[name]} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const candidateNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/panel/jobs', label: 'Jobs', icon: 'jobs' },
  { to: '/panel/applications', label: 'Applications', icon: 'applications' },
  { to: '/panel/profile', label: 'Profile', icon: 'profile' },
];

const recruiterNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/panel/job-postings', label: 'Job Postings', icon: 'postings' },
  { to: '/panel/job-applications', label: 'Applications', icon: 'applications' },
];

const adminNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/panel/admin/companies', label: 'Companies', icon: 'companies' },
  { to: '/panel/admin/company-approvals', label: 'Company approvals', icon: 'approvals' },
  { to: '/panel/admin/job-postings', label: 'Job Postings', icon: 'postings' },
  { to: '/panel/job-applications', label: 'Applications', icon: 'applications' },
];

const getNavItems = (role?: string) => {
  if (role === 'Candidate') {
    return candidateNav;
  }

  if (role === 'Admin') {
    return adminNav;
  }

  return recruiterNav;
};

export const PanelShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAtomValue(authSessionAtom);
  const signOut = useSetAtom(signOutAtom);
  const { theme, setTheme } = useAppTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarStateUserId, setSidebarStateUserId] = useState<string | null>(null);
  const navItems = getNavItems(session?.user.role);
  const sidebarUserId = session?.user.id ?? null;
  const sidebarStorageKey = sidebarUserId ? `careerscope:panel-sidebar:${sidebarUserId}` : null;
  const displayName = session?.user.name || [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'there';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const profileImageUrl = useMemo(() => {
    const imageUrl = session?.user.image;

    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const baseUrl = getApiBaseUrl();
    return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${imageUrl}` : new URL(imageUrl, baseUrl).toString();
  }, [session?.user.image]);
  const isDark = theme === 'dark';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarUserId || !sidebarStorageKey) {
      setSidebarCollapsed(false);
      setSidebarStateUserId(null);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(sidebarStorageKey);
      setSidebarCollapsed(storedValue === 'collapsed' || storedValue === 'true');
    } catch {
      setSidebarCollapsed(false);
    }

    setSidebarStateUserId(sidebarUserId);
  }, [sidebarStorageKey, sidebarUserId]);

  useEffect(() => {
    if (!sidebarStorageKey || !sidebarUserId || sidebarStateUserId !== sidebarUserId) {
      return;
    }

    try {
      window.localStorage.setItem(sidebarStorageKey, sidebarCollapsed ? 'collapsed' : 'expanded');
    } catch {
      // localStorage can be unavailable in private browsing or restricted environments.
    }
  }, [sidebarCollapsed, sidebarStateUserId, sidebarStorageKey, sidebarUserId]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#181d26] px-4 py-3 text-white lg:hidden">
        <Button
          isIconOnly
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          variant="secondary"
          className="bg-white/10 text-white"
          onPress={() => setSidebarOpen((current) => !current)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
            {sidebarOpen ? (
              <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </Button>
        <div className="text-sm font-medium text-white">CareerScope</div>
        <div className="w-10" />
      </div>

      {sidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          type="button"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 overflow-y-auto border-r border-white/10 bg-[#181d26] py-6 text-white transition-[width,transform,padding] duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:self-start lg:translate-x-0 lg:border-b-0',
            sidebarCollapsed ? 'w-68 px-5 lg:w-20 lg:px-3' : 'w-68 px-5',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <div className="flex h-full flex-col gap-8">
            <div className="space-y-5">
              <div className={['flex items-center', sidebarCollapsed ? 'justify-between gap-3 lg:justify-center' : 'justify-between gap-3'].join(' ')}>
                <div className={['min-w-0 text-lg font-medium tracking-[-0.01em] text-white', sidebarCollapsed ? 'lg:hidden' : undefined].join(' ')}>
                  CareerScope
                </div>
                <Button
                  isIconOnly
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="hidden h-8 w-8 min-w-8 bg-white/5 text-white/70 lg:inline-flex"
                  variant="ghost"
                  onPress={() => setSidebarCollapsed((current) => !current)}
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </div>
              <div
                className={[
                  'rounded-2xl border border-white/10 bg-[#202732]',
                  sidebarCollapsed ? 'p-3.5 lg:p-2' : 'p-3.5',
                ].join(' ')}
                title={sidebarCollapsed ? `${displayName}${session?.user.email ? ` · ${session.user.email}` : ''}` : undefined}
              >
                <div className={['flex min-w-0 items-center', sidebarCollapsed ? 'gap-3 lg:justify-center lg:gap-0' : 'gap-3'].join(' ')}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5e9d4] text-sm font-semibold text-[#181d26]">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials || displayName[0]?.toUpperCase()
                    )}
                  </div>
                  <div className={['min-w-0 flex-1', sidebarCollapsed ? 'block lg:hidden' : 'block'].join(' ')}>
                    <div className="truncate text-sm font-medium leading-5 text-white">{displayName}</div>
                    <div className="truncate text-xs leading-5 text-white/50" title={session?.user.email || undefined}>
                      {session?.user.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav className="grid gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/panel'}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    [
                      'flex items-center rounded-lg border py-2.5 text-sm',
                      sidebarCollapsed ? 'gap-3 px-3.5 lg:justify-center lg:gap-0 lg:px-2' : 'gap-3 px-3.5',
                      isActive
                        ? 'border-[#f5e9d4] bg-[#f5e9d4] !text-[#181d26]'
                        : 'border-transparent bg-transparent !text-white/60',
                    ].join(' ')
                  }
                >
                  <NavGlyph name={item.icon} />
                  <span className={['font-medium leading-5 tracking-[-0.01em]', sidebarCollapsed ? 'block lg:hidden' : 'block'].join(' ')}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="grid gap-2">
                <Button
                  className={['w-full bg-white/5 text-white', sidebarCollapsed ? 'justify-start lg:justify-center lg:px-0' : 'justify-start'].join(' ')}
                  variant="secondary"
                  onPress={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="inline-flex items-center gap-2">
                    {isDark ? (
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M12 2a1 1 0 0 1 1 1v1.07a8 8 0 0 1 0 15.86V21a1 1 0 1 1-2 0v-1.07a8 8 0 0 1 0-15.86V3a1 1 0 0 1 1-1Zm0 4a6 6 0 1 0 0 12V6Z" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-15a1 1 0 0 1 1 1v1.08a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v1.08a1 1 0 1 1-2 0V21a1 1 0 0 1 1-1ZM4.92 5.51a1 1 0 0 1 1.41 0l.76.76a1 1 0 0 1-1.41 1.41l-.76-.76a1 1 0 0 1 0-1.41Zm12.99 12.99a1 1 0 0 1 1.41 0l.76.76a1 1 0 0 1-1.41 1.41l-.76-.76a1 1 0 0 1 0-1.41ZM2 12a1 1 0 0 1 1-1h1.08a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm17.92 0a1 1 0 0 1 1-1H21a1 1 0 1 1 0 2h-1.08a1 1 0 0 1-1-1Zm-15.9 7.24a1 1 0 0 1 0-1.41l.76-.76a1 1 0 1 1 1.41 1.41l-.76.76a1 1 0 0 1-1.41 0Zm12.99-12.99a1 1 0 0 1 0-1.41l.76-.76a1 1 0 1 1 1.41 1.41l-.76.76a1 1 0 0 1-1.41 0Z" />
                      </svg>
                    )}
                    <span className={sidebarCollapsed ? 'lg:hidden' : undefined}>{isDark ? 'Light mode' : 'Dark mode'}</span>
                  </span>
                </Button>
                <Button
                  className={['w-full text-white/70', sidebarCollapsed ? 'justify-start lg:justify-center lg:px-0' : 'justify-start'].join(' ')}
                  variant="ghost"
                  onPress={() => void handleSignOut()}
                  aria-label="Sign out"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                      <path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 12h10m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={sidebarCollapsed ? 'lg:hidden' : undefined}>Sign out</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-background px-4 py-6 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
