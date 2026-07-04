import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Avatar, Button, Chip } from '@heroui/react';
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Globe2, MapPin, Star, UsersRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getCompany,
  getCompanyJobPostings,
  getCompanyReviews,
  type CompanyReviewListItem,
  type PublicCompany,
} from '../lib/companies-api';
import type { ApiPagination } from '../lib/panel-api';
import type { JobPostingListItem } from '../lib/job-postings-api';
import { getCompanyLogoUrl } from '../lib/company-logo';
import { getApiBaseUrl } from '../lib/http';
import { authSessionAtom } from '../store/auth';

const REVIEW_PAGE_SIZE = 5;
const JOB_PAGE_SIZE = 6;

const getWebsiteHref = (websiteUrl: string) =>
  /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;

const resolveReviewAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  const baseUrl = getApiBaseUrl();
  return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${assetUrl}` : new URL(assetUrl, baseUrl).toString();
};

const Rating = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#f5e9d4] px-2.5 py-1 text-xs font-medium text-[#181d26]">
    <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
    {value}/5
  </span>
);

export const CompanyProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const session = useAtomValue(authSessionAtom);
  const companyId = Number(id);
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [jobs, setJobs] = useState<JobPostingListItem[]>([]);
  const [reviews, setReviews] = useState<CompanyReviewListItem[]>([]);
  const [reviewPagination, setReviewPagination] = useState<ApiPagination | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = useMemo(() => getCompanyLogoUrl(company?.logoUrl, company?.websiteUrl, 192), [company?.logoUrl, company?.websiteUrl]);
  const backPath = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const backTo = searchParams.get('backTo');

    if (backTo?.startsWith('/') && !backTo.startsWith('//')) {
      return backTo;
    }

    return session?.user.role === 'Candidate' ? '/panel/companies' : '/companies';
  }, [location.search, session?.user.role]);

  const loadCompany = useCallback(async () => {
    if (!Number.isFinite(companyId)) {
      setError('Invalid company id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [companyResponse, jobsResponse] = await Promise.all([
        getCompany(companyId),
        getCompanyJobPostings(companyId, { page: 1, limit: JOB_PAGE_SIZE }),
      ]);

      setCompany(companyResponse.data);
      setJobs(jobsResponse.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load company');
      setCompany(null);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadReviews = useCallback(async () => {
    if (!Number.isFinite(companyId)) {
      return;
    }

    setReviewsLoading(true);

    try {
      const response = await getCompanyReviews(companyId, { page: reviewPage, limit: REVIEW_PAGE_SIZE });
      setReviews(response.data);
      setReviewPagination(response.pagination ?? null);
    } catch {
      setReviews([]);
      setReviewPagination(null);
    } finally {
      setReviewsLoading(false);
    }
  }, [companyId, reviewPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadCompany(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCompany]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadReviews]);

  if (loading) {
    return (
      <main className="text-foreground">
        <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
          Loading company...
        </section>
      </main>
    );
  }

  if (error && !company) {
    return (
      <main className="text-foreground">
        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="rounded-3xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="primary" onPress={() => void loadCompany()}>
              Retry
            </Button>
            <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to={backPath}>
              Back
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="text-foreground">
      <div className="grid gap-6">
        <Link className="inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground-500 hover:text-foreground" to={backPath}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </Link>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 items-center gap-5">
              {logoUrl ? (
                <img
                  alt={`${company?.name} logo`}
                  className="h-16 w-16 shrink-0 object-contain"
                  src={logoUrl}
                />
              ) : (
                <Avatar className="h-16 w-16 shrink-0 overflow-hidden rounded-xl !bg-[#f5e9d4] !text-[#181d26]">
                  <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-[#f5e9d4] text-lg font-semibold !text-[#181d26]" delayMs={0}>
                    {company?.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('') || <Building2 aria-hidden="true" className="h-8 w-8" strokeWidth={1.7} />}
                  </Avatar.Fallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <h1 className="text-4xl leading-[1.1] text-foreground sm:text-5xl">{company?.name}</h1>
                <p className="mt-3 max-w-3xl text-[15px] leading-7 text-foreground-500">
                  {company?.shortDescription || 'No company summary provided.'}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-foreground-500">
              {company?.websiteUrl && (
                <a
                  className="inline-flex items-center gap-2 font-medium text-foreground hover:underline"
                  href={getWebsiteHref(company.websiteUrl)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Globe2 aria-hidden="true" className="h-4 w-4" />
                  Website
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              )}
              {company?.address && (
                <span className="inline-flex items-center gap-2">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  {company.address}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-divider pt-6 sm:grid-cols-2">
            <div className="rounded-lg border border-divider bg-content2 p-4">
              <span className="inline-flex items-center gap-2 text-sm text-foreground-500">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Founded
              </span>
              <strong className="mt-2 block text-sm font-medium text-foreground">{company?.foundingYear || 'Not provided'}</strong>
            </div>
            <div className="rounded-lg border border-divider bg-content2 p-4">
              <span className="inline-flex items-center gap-2 text-sm text-foreground-500">
                <UsersRound aria-hidden="true" className="h-4 w-4" />
                Employees
              </span>
              <strong className="mt-2 block text-sm font-medium text-foreground">{company?.numberOfEmployees || 'Not provided'}</strong>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <h2 className="text-2xl text-foreground">About</h2>
          <div className="job-description-markdown mt-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {company?.description || 'No company description provided.'}
            </ReactMarkdown>
          </div>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl text-foreground">Active jobs</h2>
              <p className="mt-2 text-sm text-foreground-500">Open roles currently published by this company.</p>
            </div>
            <Chip className="rounded-full" size="sm" variant="secondary">
              {jobs.length} shown
            </Chip>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-foreground-500 md:col-span-2">
                No active jobs right now.
              </div>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  className="group rounded-xl border border-divider bg-content2 p-5 transition-transform hover:-translate-y-0.5 hover:border-foreground/25"
                  to={`/jobs/${job.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#181d26] text-white">
                      <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-medium leading-6 text-foreground group-hover:underline">
                        {job.title || 'Untitled role'}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground-500">
                        {job.shortDescription || 'No summary provided.'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl text-foreground">Company reviews</h2>
              <p className="mt-2 text-sm text-foreground-500">Feedback shared by candidates after their applications.</p>
            </div>
            {reviewPagination && (
              <span className="text-sm text-foreground-500">{reviewPagination.totalItems} total</span>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            {reviewsLoading ? (
              <div className="rounded-xl border border-divider bg-content2 p-5 text-sm text-foreground-500">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-foreground-500">
                No reviews have been posted yet.
              </div>
            ) : (
              reviews.map((review) => {
                const candidateImageUrl = resolveReviewAssetUrl(review.candidate.image);
                return (
                  <article key={review.id} className="rounded-xl border border-divider bg-content2 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5e9d4] text-sm font-semibold text-[#181d26]">
                          {candidateImageUrl ? (
                            <img alt="" className="h-full w-full object-cover" src={candidateImageUrl} />
                          ) : (
                            review.candidate.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join('')
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-foreground">{review.candidate.name}</h3>
                          <p className="text-xs text-foreground-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Date unavailable'}
                          </p>
                        </div>
                      </div>
                      <Rating value={review.rating} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-foreground-500">{review.comment}</p>
                  </article>
                );
              })
            )}
          </div>

          {reviewPagination && reviewPagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                isIconOnly
                aria-label="Previous review page"
                className="rounded-lg"
                type="button"
                variant="secondary"
                isDisabled={reviewPage <= 1 || reviewsLoading}
                onPress={() => setReviewPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground-500">
                Page {reviewPagination.currentPage} of {reviewPagination.totalPages}
              </span>
              <Button
                isIconOnly
                aria-label="Next review page"
                className="rounded-lg"
                type="button"
                variant="secondary"
                isDisabled={reviewPage >= reviewPagination.totalPages || reviewsLoading}
                onPress={() => setReviewPage((page) => page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
