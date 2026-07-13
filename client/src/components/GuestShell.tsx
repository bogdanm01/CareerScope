import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '../store/auth';
import { getPanelHomePath } from '../lib/navigation';
import { PublicHeader } from './PublicHeader';

export const GuestShell = () => {
  const session = useAtomValue(authSessionAtom);
  const location = useLocation();
  const hideHeader = !!session && /^\/companies\/[^/]+$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && (
        <PublicHeader
          sticky
          actions={session ? (
            <Link
              className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover-brand"
              to={getPanelHomePath(session.user.role)}
            >
              Dashboard
            </Link>
          ) : (
            <Link className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover-brand" to="/login">
              Sign in
            </Link>
          )}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <Outlet />
      </div>
    </div>
  );
};
