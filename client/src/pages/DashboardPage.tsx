import { useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { authSessionAtom, authLoadingAtom, signOutAtom } from '../store/auth';

type DashboardPageProps = {
  loading: boolean;
};

export const DashboardPage = ({ loading }: DashboardPageProps) => {
  const navigate = useNavigate();
  const session = useAtomValue(authSessionAtom);
  const signOut = useSetAtom(signOutAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setAuthLoading(false);
    }
  };

  const displayName = session?.user.name || session?.user.firstName || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-4xl place-items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 shadow-[0_36px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-10">
          <div className="mb-4 inline-flex rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
            CareerScope
          </div>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Welcome, {displayName}.</h1>
          <p className="mb-7 max-w-2xl text-base leading-7 text-slate-300">
            You are signed in and ready to continue from the dashboard.
          </p>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <span className="mb-2 block text-sm text-slate-400">Email</span>
              <strong className="block text-sm font-medium text-white">{session?.user.email}</strong>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <span className="mb-2 block text-sm text-slate-400">Role</span>
              <strong className="block text-sm font-medium text-white">{session?.user.role || 'Candidate'}</strong>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <span className="mb-2 block text-sm text-slate-400">Session</span>
              <strong className="block text-sm font-medium text-white">{loading ? 'Refreshing' : 'Active'}</strong>
            </div>
          </div>

          <button
            className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
            type="button"
            onClick={handleLogout}
            disabled={loading}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
