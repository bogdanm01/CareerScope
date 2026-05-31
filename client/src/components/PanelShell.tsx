import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@heroui/react';
import { authSessionAtom, signOutAtom } from '../store/auth';
import { useAppTheme } from './ThemeContext';

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
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0 fill-none stroke-current stroke-[1.75]">
    <path d={navIconPath[name]} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const candidateNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', icon: 'dashboard' },
  { to: '/panel/profile', label: 'Profile', icon: 'profile' },
  { to: '/panel/jobs', label: 'Jobs', icon: 'jobs' },
  { to: '/panel/applications', label: 'Applications', icon: 'applications' },
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
  const isDark = theme === 'dark';
  const sidebarBackground = isDark ? '#18181b' : '#ffffff';

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
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-divider bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <Button
          isIconOnly
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          variant="secondary"
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
        <div className="text-sm font-semibold tracking-[0.24em] text-default-400">CareerScope</div>
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

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside
          style={{
            backgroundColor: sidebarBackground,
            backgroundImage: 'none',
            opacity: 1,
            backdropFilter: 'none',
          }}
          className={[
            'fixed inset-y-0 left-0 z-40 w-[292px] border-r border-divider px-5 py-6 transition-transform duration-200 lg:static lg:z-auto lg:min-h-screen lg:translate-x-0 lg:border-b-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <div className="flex h-full flex-col gap-7">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-default-400">CareerScope</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Panel</h1>
              </div>
              <div className="rounded-2xl border border-divider bg-content2 px-4 py-3 shadow-sm">
                <div className="text-sm font-medium text-foreground">{displayName}</div>
                <div className="mt-0.5 text-xs leading-5 text-default-400">
                  {roleLabel}
                  {' '}
                  <span className="text-default-300">•</span>
                  {' '}
                  {session?.user.email}
                </div>
              </div>
            </div>

            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/panel'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[0.94rem] transition',
                      isActive
                        ? 'border-primary/25 bg-primary/10 text-foreground shadow-sm'
                        : 'border-divider bg-content1 text-default-500 hover:border-divider hover:bg-content2 hover:text-foreground',
                    ].join(' ')
                  }
                >
                  <NavGlyph name={item.icon} />
                  <span className="block font-medium leading-5 tracking-[-0.01em]">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-divider pt-4">
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-default-400">Sidebar footer</div>
              <div className="grid gap-2">
                <Button
                  className="w-full justify-start"
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
                <Button className="w-full justify-start" variant="ghost" onPress={() => void handleSignOut()}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-7 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
