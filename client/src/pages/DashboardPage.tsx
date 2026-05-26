import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '../store/auth';

type DashboardPageProps = {
  loading: boolean;
};

const getNextActions = (role?: string) => {
  if (role === 'Candidate') {
    return [
      { to: '/panel/profile', label: 'Complete your profile', description: 'Add skills and upload a CV.' },
      { to: '/panel/jobs', label: 'Browse jobs', description: 'Review active openings and apply.' },
      { to: '/panel/applications', label: 'Review applications', description: 'Check the status of your submissions.' },
    ];
  }

  if (role === 'Admin') {
    return [
      { to: '/panel/admin/companies', label: 'Approve companies', description: 'Review pending recruiter company registrations.' },
      { to: '/panel/admin/job-postings', label: 'Approve job postings', description: 'Review postings before they go live.' },
    ];
  }

  return [
    { to: '/panel/job-postings', label: 'Create a posting', description: 'Draft or submit a new role.' },
    { to: '/panel/job-applications', label: 'Review applicants', description: 'Open job applications by posting.' },
  ];
};

export const DashboardPage = ({ loading }: DashboardPageProps) => {
  const session = useAtomValue(authSessionAtom);
  const role = session?.user.role;
  const displayName = session?.user.name || [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'there';
  const onboardingStatus = session?.user.onboardingStatus
    ? session.user.onboardingStatus.replace(/([a-z])([A-Z])/g, '$1 $2')
    : 'Profile created';
  const nextActions = getNextActions(role);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
              Dashboard
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome back, {displayName}.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {role === 'Candidate'
                ? 'Use this panel to complete your profile, discover jobs, and apply from one place.'
                : role === 'Admin'
                  ? 'Use this panel to approve companies and job postings before they go live.'
                  : 'Use this panel to create job postings, review applicants, and manage your hiring pipeline.'}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3">
            <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">Status</span>
            <strong className="mt-1 block text-sm font-semibold text-white">{loading ? 'Refreshing' : onboardingStatus}</strong>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Email</span>
            <strong className="mt-2 block break-all text-sm font-medium text-white">{session?.user.email}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Role</span>
            <strong className="mt-2 block text-sm font-medium text-white">{role || 'Candidate'}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Panel</span>
            <strong className="mt-2 block text-sm font-medium text-white">
              {role === 'Candidate' ? 'Candidate workspace' : role === 'Admin' ? 'Admin workspace' : 'Recruiter workspace'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {nextActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-500/10"
          >
            <span className="block text-lg font-semibold text-white">{action.label}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-300">{action.description}</span>
            <span className="mt-4 inline-flex text-sm font-medium text-sky-200 group-hover:text-white">
              Open page
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
};
