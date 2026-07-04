import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button, Card, Chip } from '@heroui/react';
import { BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, ClipboardCheck, FilePlus2, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { authSessionAtom } from '../store/auth';
import {
  getMyJobApplications,
  getRecruiterJobApplications,
  type CandidateJobApplicationListItem,
  type RecruiterJobApplicationListItem,
} from '../lib/job-applications-api';
import { getActiveJobPostings, getRecruiterJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { getAdminCompanies, getAdminJobPostings, getPendingJobPostings, type AdminCompanyListItem } from '../lib/admin-api';
import { formatDate } from '../lib/date-format';
import { getCompanyLogoUrl } from '../lib/company-logo';

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

type RecruiterApplicationDashboardItem = RecruiterJobApplicationListItem & {
  postingTitle: string;
};

type RecruiterDashboardState = {
  postings: JobPostingListItem[];
  applications: RecruiterApplicationDashboardItem[];
  postingsError: string | null;
  applicationsWarning: string | null;
};

const defaultRecruiterDashboardState: RecruiterDashboardState = {
  postings: [],
  applications: [],
  postingsError: null,
  applicationsWarning: null,
};

const getTotalItems = <T,>(response: { data: T[]; pagination?: { totalItems: number } }) =>
  response.pagination?.totalItems ?? response.data.length;

export const DashboardPage = () => {
  const navigate = useNavigate();
  const session = useAtomValue(authSessionAtom);
  const role = session?.user.role;
  const displayName = session?.user.name || [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'there';
  const isOnboardingComplete = role === 'Candidate' && session?.user.onboardingStatus === 'Completed';
  const [applications, setApplications] = useState<CandidateJobApplicationListItem[]>([]);
  const [latestJobs, setLatestJobs] = useState<JobPostingListItem[]>([]);
  const [activeJobsTotal, setActiveJobsTotal] = useState(0);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardState>(defaultAdminDashboardState);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(false);
  const [recruiterDashboard, setRecruiterDashboard] = useState<RecruiterDashboardState>(defaultRecruiterDashboardState);
  const [recruiterDashboardLoading, setRecruiterDashboardLoading] = useState(false);

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

  useEffect(() => {
    if (role !== 'Recruiter') {
      return;
    }

    let mounted = true;

    const loadRecruiterDashboard = async () => {
      setRecruiterDashboardLoading(true);

      try {
        const postingsResponse = await getRecruiterJobPostings({ page: 1, limit: 100, orderBy: 'createdAt', sort: 'desc' });

        if (!mounted) {
          return;
        }

        const postings = postingsResponse.data;
        const applicationResults = await Promise.allSettled(
          postings.map(async (posting) => {
            const response = await getRecruiterJobApplications(posting.id);

            return response.data.map((application) => ({
              ...application,
              postingTitle: posting.title || `Posting #${posting.id}`,
            }));
          }),
        );

        if (!mounted) {
          return;
        }

        setRecruiterDashboard({
          postings,
          applications: applicationResults.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
          postingsError: null,
          applicationsWarning: applicationResults.some((result) => result.status === 'rejected')
            ? 'Some application activity could not be loaded.'
            : null,
        });
      } catch (error) {
        if (mounted) {
          setRecruiterDashboard({
            postings: [],
            applications: [],
            postingsError: error instanceof Error ? error.message : 'Unable to load recruiter dashboard.',
            applicationsWarning: null,
          });
        }
      } finally {
        if (mounted) {
          setRecruiterDashboardLoading(false);
        }
      }
    };

    void loadRecruiterDashboard();

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

  const recruiterStats = useMemo(() => {
    const postings = recruiterDashboard.postings;
    const recentPostings = [...postings]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 3);
    const latestApplicants = [...recruiterDashboard.applications]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 3);

    return {
      totalPostings: postings.length,
      activePostings: postings.filter((posting) => posting.status === 'Active').length,
      pendingPostings: postings.filter((posting) => posting.status === 'PendingApproval').length,
      totalApplications: recruiterDashboard.applications.length,
      recentPostings,
      latestApplicants,
    };
  }, [recruiterDashboard]);

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
        ) : role === 'Recruiter' ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Postings', value: recruiterStats.totalPostings, icon: BriefcaseBusiness, iconClassName: 'bg-[#181d26] text-white' },
              { label: 'Active postings', value: recruiterStats.activePostings, icon: CheckCircle2, iconClassName: 'bg-[#e8f8f1] text-[#19734f]' },
              { label: 'Pending approval', value: recruiterStats.pendingPostings, icon: ClipboardCheck, iconClassName: 'bg-[#f5e9d4] text-[#8a5a12]' },
              { label: 'Applications', value: recruiterStats.totalApplications, icon: UsersRound, iconClassName: 'bg-[#aa2d00] text-white' },
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
                        {recruiterDashboardLoading ? '—' : stat.value}
                      </strong>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
      </section>

      {role === 'Recruiter' && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
          <Card className="border border-divider shadow-none">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl text-foreground">Recent postings</h3>
                  <p className="mt-2 text-sm text-default-500">Latest roles from your company.</p>
                </div>
                <Button
                  className="h-10 shrink-0 rounded-lg bg-[#181d26] px-4 !text-sm font-medium text-white hover:bg-[#252b36]"
                  type="button"
                  variant="secondary"
                  onPress={() => navigate('/panel/job-postings/new')}
                >
                  <FilePlus2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  Add posting
                </Button>
              </div>

              <div className="mt-6 grid gap-3">
                {recruiterDashboardLoading ? (
                  <div className="rounded-xl border border-divider bg-content2 p-5 text-sm text-default-500">
                    Loading recent postings...
                  </div>
                ) : recruiterDashboard.postingsError ? (
                  <div className="rounded-xl border border-danger/20 bg-danger/10 p-5 text-sm leading-6 text-danger-700">
                    {recruiterDashboard.postingsError}
                  </div>
                ) : recruiterStats.recentPostings.length === 0 ? (
                  <Link
                    to="/panel/job-postings/new"
                    className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-default-500 transition-colors hover:bg-content1"
                  >
                    No postings yet. Create your first posting to start collecting applicants.
                  </Link>
                ) : (
                  recruiterStats.recentPostings.map((posting) => (
                    <Link
                      key={posting.id}
                      to={`/panel/job-postings/${posting.id}`}
                      className="rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block truncate text-base font-medium text-foreground">
                            {posting.title || 'Untitled role'}
                          </span>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-default-500">
                            {posting.shortDescription || 'No short description provided.'}
                          </p>
                        </div>
                        <Chip
                          className="shrink-0 rounded-md"
                          color={posting.status === 'Active' ? 'success' : posting.status === 'PendingApproval' ? 'warning' : 'default'}
                          size="sm"
                          variant="soft"
                        >
                          {getAdminStatusLabel(posting.status)}
                        </Chip>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-default-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                          Created {formatDate(posting.createdAt)}
                        </span>
                        <span>
                          {posting.expiresAt ? `Closes ${formatDate(posting.expiresAt)}` : 'No expiry'}
                        </span>
                      </div>
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
                  <h3 className="text-2xl text-foreground">Latest applicants</h3>
                  <p className="mt-2 text-sm text-default-500">Newest submissions across your postings.</p>
                </div>
                <Link className="whitespace-nowrap rounded-lg border border-divider px-3 py-2 text-sm font-medium text-foreground" to="/panel/job-applications">
                  View all
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {recruiterDashboard.applicationsWarning && !recruiterDashboardLoading && (
                  <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm leading-6 text-warning-700">
                    {recruiterDashboard.applicationsWarning}
                  </div>
                )}
                {recruiterDashboardLoading ? (
                  <div className="rounded-xl border border-divider bg-content2 p-5 text-sm text-default-500">
                    Loading latest applicants...
                  </div>
                ) : recruiterDashboard.postingsError ? (
                  <div className="rounded-xl border border-danger/20 bg-danger/10 p-5 text-sm leading-6 text-danger-700">
                    Applications could not be loaded because postings failed to load.
                  </div>
                ) : recruiterStats.latestApplicants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-default-500">
                    No applications yet.
                  </div>
                ) : (
                  recruiterStats.latestApplicants.map((application) => (
                    <Link
                      key={application.id}
                      to={`/panel/job-applications/${application.id}`}
                      className="rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block truncate text-base font-medium text-foreground">
                            {application.user.fullName}
                          </span>
                          <span className="mt-1 block truncate text-sm text-default-500">
                            {application.user.email}
                          </span>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="truncate text-sm text-default-500">{application.postingTitle}</span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-default-500">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                          Applied {formatDate(application.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card.Content>
          </Card>
        </section>
      )}

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
                  latestJobs.map((job) => {
                    const companyLogoUrl = getCompanyLogoUrl(job.company?.logo, job.company?.websiteUrl);

                    return (
                      <Link
                        key={job.id}
                        to={`/panel/jobs/${job.id}`}
                        className="grid gap-3 rounded-xl border border-divider bg-content2 p-4 transition-colors hover:bg-content1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <span className="flex h-11 w-11 items-center justify-start overflow-hidden rounded-lg text-white">
                          {companyLogoUrl ? (
                            <img
                              alt={`${job.company?.name || 'Company'} logo`}
                              className="h-7 w-7 object-contain"
                              src={companyLogoUrl}
                            />
                          ) : (
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#181d26]">
                              <Building2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                            </span>
                          )}
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
                    );
                  })
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

    </div>
  );
};
