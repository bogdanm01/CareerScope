import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@heroui/react';
import { authSessionAtom, signOutAtom } from '../store/auth';
import { useAppTheme } from './ThemeContext';
import { getApiBaseUrl } from '../lib/http';

type PanelNavItem = {
  to: string;
  label: string;
  icon: 'dashboard' | 'profile' | 'jobs' | 'applications' | 'companies' | 'postings';
};

const navIconPath = {
  dashboard: 'M4 12.5 12 4l8 8.5V20H4z M10 20v-6h4v6',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z',
  jobs: 'M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5zM8 10h8M8 13h5',
  applications: 'M7 4h10v16H7zm2 4h6M9 12h6M9 15h4',
  companies: 'M6 20V7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5V20m-5 0v-4h-2v4M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01',
  postings: 'M5 6h14M5 10h14M5 14h9M5 18h6',
} as const;

const NavGlyph = ({ name }: { name: PanelNavItem['icon'] }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.25 w-4.25 shrink-0 fill-none stroke-current stroke-[1.75]">
    <path d={navIconPath[name]} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const candidateNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/jobs', label: 'Jobs', icon: 'jobs' },
  { to: '/panel/applications', label: 'Applications', icon: 'applications' },
  { to: '/panel/profile', label: 'Profile', icon: 'profile' },
];

const recruiterNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/job-postings', label: 'Job Postings', icon: 'postings' },
  { to: '/panel/job-applications', label: 'Applications', icon: 'applications' },
];

const adminNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/admin/companies', label: 'Companies', icon: 'companies' },
  { to: '/panel/admin/job-postings', label: 'Job Postings', icon: 'postings' },
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
  const navItems = getNavItems(session?.user.role);
  const roleLabel = session?.user.role || 'User';
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
  const showRoleLabel = session?.user.role && session.user.role !== 'Candidate';
  const isDark = theme === 'dark';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
            'fixed inset-y-0 left-0 z-40 w-68 overflow-y-auto border-r border-white/10 bg-[#181d26] px-5 py-6 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:self-start lg:translate-x-0 lg:border-b-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <div className="flex h-full flex-col gap-8">
            <div className="space-y-5">
              <div>
                <div className="text-lg font-medium tracking-[-0.01em] text-white">CareerScope</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#202732] p-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5e9d4] text-sm font-semibold text-[#181d26]">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials || displayName[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium leading-5 text-white">{displayName}</div>
                    <div className="truncate text-xs leading-5 text-white/50" title={session?.user.email || undefined}>
                      {session?.user.email}
                    </div>
                  </div>
                </div>
                {showRoleLabel && (
                  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium leading-none text-white/65">
                    {roleLabel}
                  </div>
                )}
              </div>
            </div>

            <nav className="grid gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/panel'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm',
                      isActive
                        ? 'border-[#f5e9d4] bg-[#f5e9d4] !text-[#181d26]'
                        : 'border-transparent bg-transparent !text-white/60',
                    ].join(' ')
                  }
                >
                  <NavGlyph name={item.icon} />
                  <span className="block font-medium leading-5 tracking-[-0.01em]">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="grid gap-2">
                <Button
                  className="w-full justify-start bg-white/5 text-white"
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
                    <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
                  </span>
                </Button>
                <Button className="w-full justify-start text-white/70" variant="ghost" onPress={() => void handleSignOut()}>
                  <span className="inline-flex items-center gap-2">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                      <path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 12h10m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Sign out</span>
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
