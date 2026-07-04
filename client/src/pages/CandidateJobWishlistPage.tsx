import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Button } from '@heroui/react';
import { BriefcaseBusiness, Building2, CalendarDays, Clock3, Heart, MapPin, Trash2, WalletCards } from 'lucide-react';
import {
  getActiveJobPostings,
  type JobPostingEmploymentType,
  type JobPostingListItem,
  type JobPostingWorkLocation,
} from '../lib/job-postings-api';
import { getCompanyLogoUrl } from '../lib/company-logo';
import { getWishlistStorageKey, readWishlist, writeWishlist } from '../lib/job-wishlist';
import { authSessionAtom } from '../store/auth';

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
    : value || null;

const formatEmploymentType = (value?: string | null) =>
  value && value in employmentTypeLabels
    ? employmentTypeLabels[value as JobPostingEmploymentType]
    : value || null;

export const CandidateJobWishlistPage = () => {
  const session = useAtomValue(authSessionAtom);
  const [jobs, setJobs] = useState<JobPostingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistVersion, setWishlistVersion] = useState(0);
  const wishlistStorageKey = session?.user.role === 'Candidate'
    ? getWishlistStorageKey(String(session.user.id))
    : null;
  const wishlistJobIds = useMemo(() => {
    void wishlistVersion;
    return wishlistStorageKey ? readWishlist(wishlistStorageKey) : new Set<number>();
  }, [wishlistStorageKey, wishlistVersion]);
  const savedJobs = useMemo(
    () => jobs.filter((job) => wishlistJobIds.has(job.id)),
    [jobs, wishlistJobIds],
  );

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getActiveJobPostings({
        page: 1,
        limit: 100,
        orderBy: 'createdAt',
        sort: 'desc',
      });
      setJobs(response.data);
    } catch (loadError) {
      setJobs([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadJobs(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadJobs]);

  const removeFromWishlist = (jobId: number) => {
    if (!wishlistStorageKey) {
      return;
    }

    const next = new Set(wishlistJobIds);
    next.delete(jobId);
    writeWishlist(wishlistStorageKey, next);
    setWishlistVersion((current) => current + 1);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl leading-[1.15] text-foreground">Job wishlist</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Review jobs you saved while browsing active openings.
          </p>
        </div>
        <Link className="rounded-lg border border-divider px-4 py-2 text-sm font-medium text-foreground hover:bg-content2" to="/panel/jobs">
          Browse jobs
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500">
          Loading wishlist...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger-700">
          {error}
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-divider bg-content2 p-8 text-sm leading-6 text-foreground-500">
          <Heart aria-hidden="true" className="mb-3 h-6 w-6 text-[#c24141]" strokeWidth={1.8} />
          Your wishlist is empty. Save jobs with the heart button to see them here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedJobs.map((job) => {
            const companyLogoUrl = getCompanyLogoUrl(job.company?.logo, job.company?.websiteUrl);
            const workLocation = formatWorkLocation(job.workLocation);
            const employmentType = formatEmploymentType(job.employmentType);

            return (
              <article key={job.id} className="flex min-h-72 flex-col rounded-xl border border-divider bg-content1 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-11 shrink-0 items-center justify-start overflow-hidden rounded-lg text-white ${companyLogoUrl ? 'w-7' : 'w-11'}`}>
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
                    <div className="min-w-0">
                      <p className="truncate text-xs text-foreground-500">{job.company?.name || 'Unknown company'}</p>
                      <h3 className="truncate text-base font-medium text-foreground">{job.title || 'Untitled role'}</h3>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    aria-label={`Remove ${job.title || 'job'} from wishlist`}
                    className="shrink-0 border border-[#f2a6a6] bg-[#fff1f1] text-[#c24141] hover:bg-[#ffe4e4]"
                    size="sm"
                    type="button"
                    variant="secondary"
                    onPress={() => removeFromWishlist(job.id)}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </Button>
                </div>

                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground-500">
                  <span className="inline-flex items-center gap-1.5 text-[#19734f]">
                    <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                    Active opening
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                    {job.expiresAt ? `Closes ${new Date(job.expiresAt).toLocaleDateString()}` : 'No expiry'}
                  </span>
                </div>

                <p className="mt-5 line-clamp-3 text-sm leading-6 text-foreground-500">
                  {job.shortDescription || 'No description provided.'}
                </p>

                {(workLocation || employmentType || job.salaryRange) && (
                  <div className="mt-4 grid gap-2 text-xs text-foreground-500">
                    {workLocation && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                        <span className="truncate">{workLocation}</span>
                      </span>
                    )}
                    {employmentType && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                        <span className="truncate">{employmentType}</span>
                      </span>
                    )}
                    {job.salaryRange && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <WalletCards aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                        <span className="truncate">{job.salaryRange}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <div className="border-t border-divider pt-4">
                    <Link className="text-sm font-medium text-foreground hover:underline" to={`/panel/jobs/${job.id}`}>
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
