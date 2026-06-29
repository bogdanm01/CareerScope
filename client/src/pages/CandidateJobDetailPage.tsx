import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button, Chip, toast } from '@heroui/react';
import { ArrowLeft, Building2, CalendarDays, ExternalLink, Globe2, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getJobPostingDetail, type JobPostingDetail } from '../lib/job-postings-api';
import { applyToJobPosting } from '../lib/job-applications-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';

const getWebsiteHref = (websiteUrl: string) =>
  /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;

export const CandidateJobDetailPage = () => {
  const { id } = useParams();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [detail, setDetail] = useState<JobPostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobPostingId = Number(id);

  const loadDetail = async () => {
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
  };

  useEffect(() => {
    void loadDetail();
  }, [jobPostingId]);

  const handleApply = async () => {
    if (!detail) {
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
        <div className="rounded-3xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onPress={() => void loadDetail()}>
            Retry
          </Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/jobs">
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
                ? `Closes ${new Date(detail.expiresAt).toLocaleDateString()}`
                : 'No closing date'}
            </span>
          </div>
          <h2 className="mt-5 max-w-3xl text-4xl leading-[1.12] text-foreground sm:text-5xl">
            {detail?.title || 'Untitled role'}
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-foreground-500">
            {detail?.shortDescription || 'No summary provided.'}
          </p>
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
            <span className="text-sm text-foreground-500">{detail?.skills?.length || 0} listed</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(detail?.skills || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500 sm:col-span-2">
                No skill requirements listed.
              </div>
            ) : (
              detail?.skills?.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-divider bg-content2 px-4 py-3 text-sm"
                >
                  <strong className="font-medium text-foreground">{skill.name}</strong>
                  <span className="whitespace-nowrap text-foreground-500">
                    {skill.yoe === null || skill.yoe === undefined ? 'Any experience' : `${skill.yoe}y required`}
                  </span>
                </div>
              ))
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
            isDisabled={applying}
            onPress={() => void handleApply()}
          >
            {applying ? 'Applying...' : 'Apply now'}
          </Button>
          <Link
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-divider bg-content1 text-sm font-medium text-foreground"
            to="/panel/jobs"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to jobs
          </Link>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-5">
          <div className="flex items-start gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#181d26] text-white">
              <Building2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.7} />
              {detail?.company?.logo && (
                <img
                  alt={`${detail.company.name} logo`}
                  className="absolute inset-0 h-full w-full bg-white object-contain p-2"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  src={detail.company.logo}
                />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-medium text-foreground">{detail?.company?.name || 'Unknown company'}</h3>
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
