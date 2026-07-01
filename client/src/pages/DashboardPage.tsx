import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Card, Chip } from '@heroui/react';
import { BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, ClipboardCheck, FilePlus2, Search, ShieldCheck, UserRoundPen, UsersRound } from 'lucide-react';
import { authSessionAtom } from '../store/auth';
import { getMyJobApplications, type CandidateJobApplicationListItem } from '../lib/job-applications-api';
import { getActiveJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { getAdminCompanies, getAdminJobPostings, getPendingJobPostings, type AdminCompanyListItem } from '../lib/admin-api';
import { formatDate } from '../lib/date-format';

const getNextActions = (role?: string) => {
  if (role === 'Candidate') {
    return [
      { to: '/panel/profile', label: 'Complete your profile', description: 'Add skills and upload a CV.', icon: UserRoundPen },
    ];
  }

  if (role === 'Admin') {
    return [
      { to: '/panel/admin/companies', label: 'Approve companies', description: 'Review pending recruiter company registrations.', icon: Building2 },
      { to: '/panel/admin/job-postings', label: 'Approve job postings', description: 'Review postings before they go live.', icon: BriefcaseBusiness },
    ];
  }

  return [
    { to: '/panel/job-postings', label: 'Create a posting', description: 'Draft or submit a new role.', icon: FilePlus2 },
    { to: '/panel/job-applications', label: 'Review applicants', description: 'Open job applications by posting.', icon: UsersRound },
  ];
};

const getStatusLabel = (status: string) => (status === 'UnderReview' ? 'Under Review' : status);

const getAdminStatusLabel = (status: string) => (status === 'PendingApproval' ? 'Pending approval' : status);

const getStatusClassName = (status: string) => {
  switch (status) {
    case 'Accepted':
      return 'border-[#9edec5] bg-[#e8f8f1] text-[#19734f]';
    case 'Rejected':
      return 'border-[#f2a6a6] bg-[#fff1f1] text-[#c24141]';
    case 'UnderReview':
      return 'border-[#f1d39d] bg-[#fff7e8] text-[#8a5a12]';
    case 'Submitted':
      return 'border-[#cfd6e4] bg-[#f4f6f9] text-[#41454d]';
    default:
      return 'border-divider bg-content2 text-foreground-500';
  }
};

type AdminDashboardState = {
  pendingCompanies: AdminCompanyListItem[];
  pendingCompanyTotal: number;
  pendingCompaniesError: string | null;
  pendingPostings: JobPostingListItem[];
  pendingPostingTotal: number;
  pendingPostingsError: string | null;
  approvedCompanyTotal: number;
  activePostingTotal: number;
};

const defaultAdminDashboardState: AdminDashboardState = {
  pendingCompanies: [],
  pendingCompanyTotal: 0,
  pendingCompaniesError: null,
  pendingPostings: [],
  pendingPostingTotal: 0,
  pendingPostingsError: null,
  approvedCompanyTotal: 0,
  activePostingTotal: 0,
};

const getTotalItems = <T,>(response: { data: T[]; pagination?: { totalItems: number } }) =>
  response.pagination?.totalItems ?? response.data.length;

export const DashboardPage = () => {
  const session = useAtomValue(authSessionAtom);
  const role = session?.user.role;
  const displayName = session?.user.name || [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'there';
  const isOnboardingComplete = role === 'Candidate' && session?.user.onboardingStatus === 'Completed';
  const nextActions = getNextActions(role);
  const actionStyles = [
    'bg-[#aa2d00] !text-white',
    'bg-[#0a2e0e] !text-white',
    'bg-[#181d26] !text-white',
  ];
  const [applications, setApplications] = useState<CandidateJobApplicationListItem[]>([]);
  const [latestJobs, setLatestJobs] = useState<JobPostingListItem[]>([]);
  const [activeJobsTotal, setActiveJobsTotal] = useState(0);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardState>(defaultAdminDashboardState);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(false);

  useEffect(() => {
    if (role !== 'Candidate') {
      return;
    }

    let mounted = true;

    const loadCandidateDashboard = async () => {
      try {
        const [applicationsResponse, jobsResponse] = await Promise.all([
          getMyJobApplications(),
          getActiveJobPostings({ page: 1, limit: 3, orderBy: 'createdAt', sort: 'desc' }),
        ]);

        if (!mounted) {
          return;
        }

        setApplications(applicationsResponse.data);
        setLatestJobs(jobsResponse.data);
        setActiveJobsTotal(jobsResponse.pagination?.totalItems ?? jobsResponse.data.length);
      } catch {
        if (mounted) {
          setApplications([]);
          setLatestJobs([]);
          setActiveJobsTotal(0);
        }
      }
    };

    void loadCandidateDashboard();

    return () => {
      mounted = false;
    };
  }, [role]);

  useEffect(() => {
    if (role !== 'Admin') {
      return;
    }

    let mounted = true;

    const loadAdminDashboard = async () => {
      setAdminDashboardLoading(true);

      const [pendingCompaniesResult, pendingPostingsResult, approvedCompaniesResult, activePostingsResult] = await Promise.allSettled([
        getAdminCompanies({ approvalStatus: 'PendingApproval', isDeleted: false, page: 1, limit: 3, sort: 'desc', orderBy: 'id' }),
        getPendingJobPostings({ page: 1, limit: 3 }),
        getAdminCompanies({ approvalStatus: 'Approved', isDeleted: false, page: 1, limit: 1 }),
        getAdminJobPostings({ status: 'Active', page: 1, limit: 1 }),
      ]);

      if (!mounted) {
        return;
      }

      setAdminDashboard({
        pendingCompanies:
          pendingCompaniesResult.status === 'fulfilled' ? pendingCompaniesResult.value.data : [],
        pendingCompanyTotal:
          pendingCompaniesResult.status === 'fulfilled' ? getTotalItems(pendingCompaniesResult.value) : 0,
        pendingCompaniesError:
          pendingCompaniesResult.status === 'rejected'
            ? pendingCompaniesResult.reason instanceof Error
              ? pendingCompaniesResult.reason.message
              : 'Unable to load pending companies'
            : null,
        pendingPostings:
          pendingPostingsResult.status === 'fulfilled' ? pendingPostingsResult.value.data : [],
        pendingPostingTotal:
          pendingPostingsResult.status === 'fulfilled' ? getTotalItems(pendingPostingsResult.value) : 0,
        pendingPostingsError:
          pendingPostingsResult.status === 'rejected'
            ? pendingPostingsResult.reason instanceof Error
              ? pendingPostingsResult.reason.message
              : 'Unable to load pending postings'
            : null,
        approvedCompanyTotal:
          approvedCompaniesResult.status === 'fulfilled' ? getTotalItems(approvedCompaniesResult.value) : 0,
        activePostingTotal:
          activePostingsResult.status === 'fulfilled' ? getTotalItems(activePostingsResult.value) : 0,
      });
      setAdminDashboardLoading(false);
    };

    void loadAdminDashboard();

    return () => {
      mounted = false;
    };
  }, [role]);

  const applicationStats = useMemo(() => {
    const total = applications.length;
    const underReview = applications.filter((application) => application.status === 'UnderReview').length;
    const accepted = applications.filter((application) => application.status === 'Accepted').length;
    const latestActivity = [...applications]
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 4);

    return { total, underReview, accepted, latestActivity };
  }, [applications]);

  return (
    <div className="grid gap-5">
      <section className="pt-6 pb-0 sm:pt-10 sm:pb-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-4xl">
            <span className="block text-2xl leading-tight text-foreground">Welcome back,</span>
            <h2 className="mt-1 text-4xl leading-[1.1] text-foreground sm:text-5xl">
              {displayName}.
            </h2>
          </div>
          {isOnboardingComplete && (
            <Link
              className="inline-flex h-8 items-center rounded-lg border border-[#9edec5] bg-[#e8f8f1] px-3 text-xs font-medium leading-none text-[#19734f]"
              to="/panel/profile"
            >
              Profile completed
            </Link>
          )}
        </div>

        {role === 'Candidate' ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Applications', value: applicationStats.total, icon: ClipboardCheck, iconClassName: 'bg-[#aa2d00] text-white' },
              { label: 'Under review', value: applicationStats.underReview, icon: Search, iconClassName: 'bg-[#f5e9d4] text-[#8a5a12]' },
              { label: 'Accepted', value: applicationStats.accepted, icon: CheckCircle2, iconClassName: 'bg-[#e8f8f1] text-[#19734f]' },
              { label: 'Active jobs', value: activeJobsTotal, icon: BriefcaseBusiness, iconClassName: 'bg-[#0a2e0e] text-white' },
            ].map((stat) => {
              const StatIcon = stat.icon;

              return (
                <Card key={stat.label} className="border border-divider shadow-none">
                  <div className="flex min-h-20 items-center gap-5 px-3 py-2.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconClassName}`}>
                      <StatIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-default-500">{stat.label}</span>
                      <strong className="mt-1 block text-2xl font-medium leading-none text-foreground">{stat.value}</strong>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : role === 'Admin' ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Pending companies', value: adminDashboard.pendingCompanyTotal, icon: Building2, iconClassName: 'bg-[#f5e9d4] text-[#8a5a12]' },
              { label: 'Pending postings', value: adminDashboard.pendingPostingTotal, icon: ClipboardCheck, iconClassName: 'bg-[#aa2d00] text-white' },
              { label: 'Approved companies', value: adminDashboard.approvedCompanyTotal, icon: ShieldCheck, iconClassName: 'bg-[#e8f8f1] text-[#19734f]' },
              { label: 'Active postings', value: adminDashboard.activePostingTotal, icon: BriefcaseBusiness, iconClassName: 'bg-[#0a2e0e] text-white' },
            ].map((stat) => {
              const StatIcon = stat.icon;

              return (
                <Card key={stat.label} className="border border-divider shadow-none">
                  <div className="flex min-h-20 items-center gap-5 px-3 py-2.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconClassName}`}>
                      <StatIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-default-500">{stat.label}</span>
                      <strong className="mt-1 block text-2xl font-medium leading-none text-foreground">
                        {adminDashboardLoading ? '—' : stat.value}
                      </strong>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border border-divider shadow-none">
              <Card.Content className="p-4">
                <span className="block text-sm text-default-400">Email</span>
                <strong className="mt-2 block break-all text-sm font-medium text-foreground">{session?.user.email}</strong>
              </Card.Content>
            </Card>
            <Card className="border border-divider shadow-none">
              <Card.Content className="p-4">
                <span className="block text-sm text-default-400">Role</span>
                <strong className="mt-2 block text-sm font-medium text-foreground">{role || 'Candidate'}</strong>
              </Card.Content>
            </Card>
            <Card className="border border-divider bg-content2 shadow-none">
              <Card.Content className="p-4">
                <span className="block text-sm text-default-400">Panel</span>
                <strong className="mt-2 block text-sm font-medium text-foreground">
                  Recruiter workspace
                </strong>
              </Card.Content>
            </Card>
          </div>
        )}
      </section>

      {role === 'Candidate' && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
          <Card className="border border-divider shadow-none">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl text-foreground">Latest job postings</h3>
                  <p className="mt-2 text-sm text-default-500">New active roles worth checking first.</p>
                </div>
                <Link className="whitespace-nowrap rounded-lg border border-divider px-3 py-2 text-sm font-medium text-foreground" to="/panel/jobs">
                  View all
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {latestJobs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-default-500">
                    No active jobs available right now.
                  </div>
                ) : (
                  latestJobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/panel/jobs/${job.id}`}
                      className="grid gap-3 rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#181d26] text-white">
                        <Building2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs text-default-500">{job.company?.name || 'Unknown company'}</span>
                        <span className="mt-1 block truncate text-base font-medium text-foreground">{job.title || 'Untitled role'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-default-500">
                        <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                        {job.expiresAt ? `Closes ${new Date(job.expiresAt).toLocaleDateString()}` : 'No expiry'}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-divider shadow-none">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl text-foreground">Application activity</h3>
                  <p className="mt-2 text-sm text-default-500">Most recently updated submissions.</p>
                </div>
                <Link className="whitespace-nowrap rounded-lg border border-divider px-3 py-2 text-sm font-medium text-foreground" to="/panel/applications">
                  View all
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {applicationStats.latestActivity.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-default-500">
                    No application activity yet.
                  </div>
                ) : (
                  applicationStats.latestActivity.map((application) => (
                    <Link
                      key={application.id}
                      to={`/panel/applications/${application.id}`}
                      className="rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block truncate text-base font-medium text-foreground">
                            {application.jobPosting.title || 'Untitled role'}
                          </span>
                          <span className="mt-1 block truncate text-sm text-default-500">
                            {application.jobPosting.company.name}
                          </span>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                      <span className="mt-4 block text-xs text-default-500">
                        Updated {new Date(application.updatedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </Card.Content>
          </Card>
        </section>
      )}

      {role === 'Admin' && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="border border-divider shadow-none">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl text-foreground">Companies needing review</h3>
                    <p className="mt-2 text-sm text-default-500">Pending recruiter company registrations.</p>
                  </div>
                  <Link className="whitespace-nowrap rounded-lg border border-divider px-3 py-2 text-sm font-medium text-foreground" to="/panel/admin/company-approvals">
                    View all
                  </Link>
                </div>

                <div className="mt-6 grid gap-3">
                  {adminDashboardLoading ? (
                    <div className="rounded-xl border border-divider bg-content2 p-5 text-sm text-default-500">
                      Loading pending companies...
                    </div>
                  ) : adminDashboard.pendingCompaniesError ? (
                    <div className="rounded-xl border border-danger/20 bg-danger/10 p-5 text-sm leading-6 text-danger-700">
                      {adminDashboard.pendingCompaniesError}
                    </div>
                  ) : adminDashboard.pendingCompanies.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-default-500">
                      No companies are waiting for approval.
                    </div>
                  ) : (
                    adminDashboard.pendingCompanies.map((company) => (
                      <Link
                        key={company.id}
                        to={`/panel/admin/companies/${company.id}`}
                        state={{ company, backTo: '/panel' }}
                        className="rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block truncate text-base font-medium text-foreground">{company.name}</span>
                            <span className="mt-1 block truncate text-xs text-default-500">Tax ID {company.taxId}</span>
                          </div>
                          <Chip className="shrink-0 rounded-md" color="warning" size="sm" variant="soft">
                            {getAdminStatusLabel(company.approvalStatus)}
                          </Chip>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-default-500">
                          {company.shortDescription || company.address || 'No company summary provided.'}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </Card.Content>
            </Card>

            <Card className="border border-divider shadow-none">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl text-foreground">Postings awaiting approval</h3>
                    <p className="mt-2 text-sm text-default-500">Recruiter postings ready for admin review.</p>
                  </div>
                  <Link className="whitespace-nowrap rounded-lg border border-divider px-3 py-2 text-sm font-medium text-foreground" to="/panel/admin/job-postings">
                    View all
                  </Link>
                </div>

                <div className="mt-6 grid gap-3">
                  {adminDashboardLoading ? (
                    <div className="rounded-xl border border-divider bg-content2 p-5 text-sm text-default-500">
                      Loading pending postings...
                    </div>
                  ) : adminDashboard.pendingPostingsError ? (
                    <div className="rounded-xl border border-danger/20 bg-danger/10 p-5 text-sm leading-6 text-danger-700">
                      {adminDashboard.pendingPostingsError}
                    </div>
                  ) : adminDashboard.pendingPostings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-default-500">
                      No job postings are waiting for approval.
                    </div>
                  ) : (
                    adminDashboard.pendingPostings.map((posting) => (
                      <Link
                        key={posting.id}
                        to={`/panel/admin/job-postings/${posting.id}`}
                        state={{ posting }}
                        className="rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block truncate text-base font-medium text-foreground">
                              {posting.title || 'Untitled role'}
                            </span>
                            <span className="mt-1 block truncate text-sm text-default-500">
                              {posting.company?.name || 'Unknown company'}
                            </span>
                          </div>
                          <Chip className="shrink-0 rounded-md" color="warning" size="sm" variant="soft">
                            {getAdminStatusLabel(posting.status)}
                          </Chip>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-default-500">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                          Created {formatDate(posting.createdAt)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </Card.Content>
            </Card>
          </section>
        </>
      )}

      {role !== 'Candidate' && role !== 'Admin' && (
        <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {nextActions.map((action, index) => {
            const ActionIcon = action.icon;

            return (
              <Link
                key={action.to}
                to={action.to}
                className={`group flex min-h-40 flex-col justify-between rounded-xl border border-white/10 p-6 transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.005] motion-reduce:transform-none motion-reduce:transition-none ${actionStyles[index % actionStyles.length]}`}
              >
                <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white/12">
                  <ActionIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <span className="block text-xl font-normal">{action.label}</span>
                  <span className="mt-1.5 block max-w-md text-sm leading-6 text-white/70">{action.description}</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
};
