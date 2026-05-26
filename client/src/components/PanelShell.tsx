import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { authSessionAtom, signOutAtom } from '../store/auth';

type PanelNavItem = {
  to: string;
  label: string;
  description: string;
};

const candidateNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', description: 'Overview and status' },
  { to: '/panel/profile', label: 'Profile', description: 'Skills and CV' },
  { to: '/panel/jobs', label: 'Jobs', description: 'Browse and apply' },
  { to: '/panel/applications', label: 'Applications', description: 'Track submissions' },
];

const recruiterNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', description: 'Overview and status' },
  { to: '/panel/job-postings', label: 'Job Postings', description: 'Create and manage listings' },
  { to: '/panel/job-applications', label: 'Applications', description: 'Review applicants' },
];

const adminNav: PanelNavItem[] = [
  { to: '/panel', label: 'Dashboard', description: 'Overview and status' },
  { to: '/panel/admin/companies', label: 'Companies', description: 'Approve recruiter companies' },
  { to: '/panel/admin/job-postings', label: 'Job Postings', description: 'Approve pending postings' },
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
  const session = useAtomValue(authSessionAtom);
  const signOut = useSetAtom(signOutAtom);
  const navItems = getNavItems(session?.user.role);
  const roleLabel = session?.user.role || 'User';
  const displayName = session?.user.name || [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'there';

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-slate-950/70 px-5 py-5 backdrop-blur-xl lg:min-h-screen lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100">
                CareerScope
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Panel</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {displayName}
                {' '}
                <span className="text-slate-500">•</span>
                {' '}
                {roleLabel}
              </p>
            </div>

            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10 lg:mt-6"
              type="button"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>

          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/panel'}
                className={({ isActive }) =>
                  [
                    'rounded-3xl border px-4 py-3 transition',
                    isActive
                      ? 'border-sky-400/35 bg-sky-500/10 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.15)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]',
                  ].join(' ')
                }
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Session</div>
            <div className="mt-2 text-sm leading-6 text-slate-200">
              <div>{session?.user.email}</div>
              <div className="text-slate-400">{session?.user.onboardingStatus || 'Profile created'}</div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
