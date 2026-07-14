import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button, Chip, toast } from '@heroui/react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ExternalLink,
  Globe2,
  MapPin,
  TriangleAlert,
  WalletCards,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getJobPostingDetail,
  type JobPostingDetail,
  type JobPostingEmploymentType,
  type JobPostingWorkLocation,
} from '../lib/job-postings-api';
import { applyToJobPosting } from '../lib/job-applications-api';
import { authErrorAtom, authLoadingAtom, authSessionAtom } from '../store/auth';
import { formatDate } from '../lib/date-format';
import { getCompanyLogoUrl } from '../lib/company-logo';
import { getMe, type MeUserSkill } from '../lib/me-api';

const getWebsiteHref = (websiteUrl: string) =>
  /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;

const workLocationLabels: Record<JobPostingWorkLocation, string> = {
  Remote: 'Remote',
  OnSite: 'On-site',
  Hybrid: 'Hybrid',
};

const employmentTypeLabels: Record<JobPostingEmploymentType, string> = {
  FullTime: 'Full-time',
  PartTime: 'Part-time',
  Contract: 'Contract',
  Internship: 'Internship',
  Temporary: 'Temporary',
  Other: 'Other',
};

const formatWorkLocation = (value?: string | null) =>
  value && value in workLocationLabels
    ? workLocationLabels[value as JobPostingWorkLocation]
    : value || 'Not specified';

const formatEmploymentType = (value?: string | null) =>
  value && value in employmentTypeLabels
    ? employmentTypeLabels[value as JobPostingEmploymentType]
    : value || 'Not specified';

type CandidateJobDetailPageProps = {
  isPublic?: boolean;
};

export const CandidateJobDetailPage = ({ isPublic = false }: CandidateJobDetailPageProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useAtomValue(authSessionAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [detail, setDetail] = useState<JobPostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateSkills, setCandidateSkills] = useState<MeUserSkill[] | null>(null);

  const jobPostingId = Number(id);
  const backPath = isPublic ? '/jobs' : '/panel/jobs';
  const companyBackPath = `${isPublic ? '/jobs' : '/panel/jobs'}/${jobPostingId}`;
  const isApplyBlockedByRole = isPublic && !!session && session.user.role !== 'Candidate';
  const companyLogoUrl = getCompanyLogoUrl(detail?.company?.logo, detail?.company?.websiteUrl);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(jobPostingId)) {
      setError('Invalid job posting id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getJobPostingDetail(jobPostingId, ['skills', 'company', 'statusHistory']);
      setDetail(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job posting');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [jobPostingId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDetail(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDetail]);

  useEffect(() => {
    if (session?.user.role !== 'Candidate') return;

    let mounted = true;
    getMe().then(
      (response) => {
        if (mounted) setCandidateSkills(response.data.skills);
      },
      () => {
        if (mounted) setCandidateSkills([]);
      },
    );

    return () => {
      mounted = false;
    };
  }, [session?.user.id, session?.user.role]);

  const handleApply = async () => {
    if (!detail) {
      return;
    }

    if (isPublic && !session) {
      navigate(`/register?returnTo=${encodeURIComponent(`/jobs/${detail.id}`)}`);
      return;
    }

    if (isPublic && session?.user.role !== 'Candidate') {
      return;
    }

    setApplying(true);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await applyToJobPosting(detail.id);
      toast.success('Application submitted', {
        description: 'Your application was submitted successfully.',
      });
    } catch (applyError) {
      toast.danger('Application failed', {
        description: applyError instanceof Error ? applyError.message : 'Unable to apply for this job',
      });
    } finally {
      setApplying(false);
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading job posting...
      </section>
    );
  }

  if (error && !detail) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onPress={() => void loadDetail()}>
            Retry
          </Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to={backPath}>
            Back to jobs
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <main className="grid min-w-0 gap-6">
        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Chip color="success" size="sm" variant="soft">
              {detail?.status || 'Unknown'}
            </Chip>
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground-500">
              <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
              {detail?.expiresAt
                ? `Closes ${formatDate(detail.expiresAt)}`
                : 'No closing date'}
            </span>
          </div>
          <h2 className="mt-5 max-w-3xl text-4xl leading-[1.12] text-foreground sm:text-5xl">
            {detail?.title || 'Untitled role'}
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-foreground-500">
            {detail?.shortDescription || 'No summary provided.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-divider bg-content2 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-400">
                <MapPin aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                Location
              </span>
              <p className="mt-2 text-sm font-medium text-foreground">
                {formatWorkLocation(detail?.workLocation)}
              </p>
            </div>
            <div className="rounded-lg border border-divider bg-content2 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-400">
                <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                Employment
              </span>
              <p className="mt-2 text-sm font-medium text-foreground">
                {formatEmploymentType(detail?.employmentType)}
              </p>
            </div>
            <div className="rounded-lg border border-divider bg-content2 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-400">
                <WalletCards aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                Salary
              </span>
              <p className="mt-2 text-sm font-medium text-foreground">
                {detail?.salaryRange || 'Not specified'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-2xl text-foreground">Description</h3>
          <div className="job-description-markdown mt-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {detail?.description || 'No description provided.'}
            </ReactMarkdown>
          </div>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl text-foreground">Required skills</h3>
              <p className="mt-2 text-sm text-foreground-500">
                Skills and minimum experience requested for this role.
              </p>
            </div>
            {candidateSkills ? (
              <Chip className="rounded-lg" color="success" size="sm" variant="soft">
                {(detail?.skills || []).filter((skill) => candidateSkills.some((candidateSkill) => candidateSkill.id === skill.id)).length}
                {' '}of {detail?.skills?.length || 0} skills in profile
              </Chip>
            ) : (
              <span className="text-sm text-foreground-500">{detail?.skills?.length || 0} listed</span>
            )}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(detail?.skills || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500 sm:col-span-2">
                No skill requirements listed.
              </div>
            ) : (
              detail?.skills?.map((skill) => {
                const candidateSkill = candidateSkills?.find((item) => item.id === skill.id);
                const requiredYears = skill.yoe;
                const candidateYears = candidateSkill?.yearsOfExperience;
                const meetsExperience = Boolean(candidateSkill) && (
                  requiredYears === null ||
                  requiredYears === undefined ||
                  (candidateYears !== null && candidateYears !== undefined && candidateYears >= requiredYears)
                );
                const hasExperienceGap = Boolean(candidateSkill) && !meetsExperience;
                const requiredLabel = requiredYears === null || requiredYears === undefined
                  ? 'No minimum required'
                  : `${requiredYears}y required`;

                if (!candidateSkills) {
                  return (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-divider bg-content2 px-4 py-3 text-sm"
                    >
                      <strong className="font-medium text-foreground">{skill.name}</strong>
                      <span className="whitespace-nowrap text-foreground-500">{requiredLabel}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={skill.id}
                    className={[
                      'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
                      meetsExperience ? 'status-success' : hasExperienceGap ? 'status-warning' : 'status-danger',
                    ].join(' ')}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3 font-medium">
                      {meetsExperience ? (
                        <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                      ) : hasExperienceGap ? (
                        <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
                      ) : (
                        <X aria-hidden="true" className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{skill.name}</span>
                    </span>
                    <span className="text-right">
                      {!candidateSkill
                        ? `Not in profile · ${requiredLabel}`
                        : candidateYears === null || candidateYears === undefined
                          ? `In profile · experience not provided · ${requiredLabel}`
                          : `${candidateYears}y experience · ${requiredLabel}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <aside className="grid gap-6 lg:sticky lg:top-6">
        <section className="rounded-xl border border-divider bg-content1 p-5">
          <Button
            className="h-11 w-full rounded-lg"
            type="button"
            variant="primary"
            isDisabled={applying || isApplyBlockedByRole}
            onPress={() => void handleApply()}
          >
            {applying
              ? 'Applying...'
              : isPublic && !session
                ? 'Create account to apply'
                : isApplyBlockedByRole
                  ? 'Candidate account required'
                  : 'Apply now'}
          </Button>
          {isApplyBlockedByRole && (
            <p className="mt-3 text-sm leading-6 text-foreground-500">
              Only candidate accounts can apply to public job postings.
            </p>
          )}
          <Link
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-divider bg-content1 text-sm font-medium text-foreground"
            to={backPath}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to jobs
          </Link>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-5">
          <div className="flex items-start gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#181d26] text-white">
              <Building2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.7} />
              {companyLogoUrl && (
                <img
                  alt={`${detail?.company?.name || 'Company'} logo`}
                  className="absolute inset-0 h-full w-full bg-white object-contain p-2"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  src={companyLogoUrl}
                />
              )}
            </div>
            <div className="min-w-0">
              {detail?.company?.id ? (
                <Link
                  className="text-lg font-medium text-foreground underline-offset-4 hover:underline"
                  to={`/companies/${detail.company.id}?backTo=${encodeURIComponent(companyBackPath)}`}
                >
                  {detail.company.name || 'Unknown company'}
                </Link>
              ) : (
                <h3 className="text-lg font-medium text-foreground">{detail?.company?.name || 'Unknown company'}</h3>
              )}
              <p className="mt-1 text-sm leading-6 text-foreground-500">
                {detail?.company?.shortDescription || 'No company description provided.'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-divider pt-5 text-sm">
            <div className="flex items-start gap-3">
              <Globe2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-foreground-500" strokeWidth={1.7} />
              <div className="min-w-0">
                <span className="block text-xs text-foreground-500">Website</span>
                {detail?.company?.websiteUrl ? (
                  <a
                    className="mt-1 inline-flex max-w-full items-center gap-1 font-medium text-foreground hover:underline"
                    href={getWebsiteHref(detail.company.websiteUrl)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="truncate">{detail.company.websiteUrl}</span>
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="mt-1 block text-foreground">Not provided</span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-foreground-500" strokeWidth={1.7} />
              <div>
                <span className="block text-xs text-foreground-500">Address</span>
                <span className="mt-1 block leading-6 text-foreground">
                  {detail?.company?.address || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
};
