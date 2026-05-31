import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Card, Chip } from '@heroui/react';
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
      <section className="rounded-2xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Chip size="sm" variant="secondary">
              Dashboard
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {displayName}.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-default-500 sm:text-base">
              {role === 'Candidate'
                ? 'Use this panel to complete your profile, discover jobs, and apply from one place.'
                : role === 'Admin'
                  ? 'Use this panel to approve companies and job postings before they go live.'
                  : 'Use this panel to create job postings, review applicants, and manage your hiring pipeline.'}
            </p>
          </div>

          <Card>
            <Card.Content className="px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.22em] text-default-400">Status</span>
              <strong className="mt-1 block text-sm font-semibold text-foreground">{loading ? 'Refreshing' : onboardingStatus}</strong>
            </Card.Content>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <Card.Content className="p-4">
              <span className="block text-sm text-default-400">Email</span>
              <strong className="mt-2 block break-all text-sm font-medium text-foreground">{session?.user.email}</strong>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <span className="block text-sm text-default-400">Role</span>
              <strong className="mt-2 block text-sm font-medium text-foreground">{role || 'Candidate'}</strong>
            </Card.Content>
          </Card>
          <Card className="border border-default-200 bg-content2">
            <Card.Content className="p-4">
              <span className="block text-sm text-default-400">Panel</span>
              <strong className="mt-2 block text-sm font-medium text-foreground">
                {role === 'Candidate' ? 'Candidate workspace' : role === 'Admin' ? 'Admin workspace' : 'Recruiter workspace'}
              </strong>
            </Card.Content>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {nextActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group rounded-2xl border border-divider bg-content1 p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-content2"
          >
            <span className="block text-lg font-semibold text-foreground">{action.label}</span>
            <span className="mt-2 block text-sm leading-6 text-default-500">{action.description}</span>
            <span className="mt-4 inline-flex text-sm font-medium text-primary group-hover:text-foreground">
              Open page
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
};
