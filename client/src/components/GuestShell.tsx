import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '../store/auth';
import { getPanelHomePath } from '../lib/navigation';

const navItems = [
  { to: '/jobs', label: 'Jobs' },
  { to: '/companies', label: 'Companies' },
];

export const GuestShell = () => {
  const session = useAtomValue(authSessionAtom);
  const location = useLocation();
  const hideHeader = !!session && /^\/companies\/[^/]+$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && (
        <header className="sticky top-0 z-30 border-b border-divider bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link className="text-lg font-medium tracking-[-0.01em] text-foreground" to="/">
              CareerScope
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-[#181d26] !text-white' : 'text-foreground-500 hover:bg-content2 hover:text-foreground',
                    ].join(' ')
                  }
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {session ? (
                <Link
                  className="rounded-lg bg-[#181d26] px-3 py-2 text-sm font-medium !text-white hover:bg-[#252d3a]"
                  to={getPanelHomePath(session.user.role)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-500 hover:bg-content2 hover:text-foreground" to="/login">
                    Sign in
                  </Link>
                  <Link className="rounded-lg bg-[#181d26] px-3 py-2 text-sm font-medium !text-white hover:bg-[#252d3a]" to="/register">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <Outlet />
      </div>
    </div>
  );
};
