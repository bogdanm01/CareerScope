import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, ListBox, Modal, Select, toast, useOverlayState } from '@heroui/react';
import { BriefcaseBusiness, Building2, CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, Heart, MapPin, RotateCcw, Search, WalletCards, X } from 'lucide-react';
import {
  getActiveJobPostings,
  type JobPostingEmploymentType,
  type JobPostingListItem,
  type JobPostingWorkLocation,
} from '../lib/job-postings-api';
import { applyToJobPosting } from '../lib/job-applications-api';
import { useAtomValue, useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom, authSessionAtom } from '../store/auth';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import type { ApiPagination } from '../lib/panel-api';
import type { Skill } from '../lib/skills-api';
import { getCompanyLogoUrl } from '../lib/company-logo';
import { getWishlistStorageKey, readWishlist, writeWishlist } from '../lib/job-wishlist';

type SortValue = 'createdAt-desc' | 'createdAt-asc' | 'expiresAt-asc' | 'expiresAt-desc';

type SelectedSkillFilter = {
  id: number;
  name: string;
  slug: string;
};

const sortOptions: { value: SortValue; label: string; orderBy: 'createdAt' | 'expiresAt'; sort: 'asc' | 'desc' }[] = [
  { value: 'createdAt-desc', label: 'Newest first', orderBy: 'createdAt', sort: 'desc' },
  { value: 'createdAt-asc', label: 'Oldest first', orderBy: 'createdAt', sort: 'asc' },
  { value: 'expiresAt-asc', label: 'Closing soon', orderBy: 'expiresAt', sort: 'asc' },
  { value: 'expiresAt-desc', label: 'Closing latest', orderBy: 'expiresAt', sort: 'desc' },
];

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

const pageSize = 9;

type CandidateJobsPageProps = {
  isPublic?: boolean;
};

export const CandidateJobsPage = ({ isPublic = false }: CandidateJobsPageProps) => {
  const navigate = useNavigate();
  const session = useAtomValue(authSessionAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [jobs, setJobs] = useState<JobPostingListItem[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState<SortValue>('createdAt-desc');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkillFilter[]>([]);
  const [skillResetKey, setSkillResetKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [wishlistVersion, setWishlistVersion] = useState(0);
  const filterModal = useOverlayState();
  const selectedSort = sortOptions.find((option) => option.value === sortValue) ?? sortOptions[0];
  const selectedSkillIds = useMemo(() => selectedSkills.map((skill) => skill.id), [selectedSkills]);
  const hasActiveFilters = search.trim().length > 0 || selectedSkills.length > 0 || sortValue !== 'createdAt-desc';
  const detailsBasePath = isPublic ? '/jobs' : '/panel/jobs';
  const isApplyBlockedByRole = isPublic && !!session && session.user.role !== 'Candidate';
  const wishlistStorageKey = session?.user.role === 'Candidate'
    ? getWishlistStorageKey(String(session.user.id))
    : null;
  const wishlistJobIds = useMemo(
    () => {
      void wishlistVersion;
      return wishlistStorageKey ? readWishlist(wishlistStorageKey) : new Set<number>();
    },
    [wishlistStorageKey, wishlistVersion],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const trimmedSearch = search.trim();
        const response = await getActiveJobPostings({
          page: currentPage,
          limit: pageSize,
          orderBy: selectedSort.orderBy,
          sort: selectedSort.sort,
          search: trimmedSearch.length >= 2 ? trimmedSearch : undefined,
          skills: selectedSkills.length > 0 ? selectedSkills.map((skill) => skill.slug).join(',') : undefined,
        });
        if (mounted) {
          setJobs(response.data);
          setPagination(response.pagination ?? null);
        }
      } catch {
        if (mounted) {
          setJobs([]);
          setPagination(null);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [currentPage, search, selectedSkills, selectedSort.orderBy, selectedSort.sort]);

  const addSkillFilter = () => {
    if (!selectedSkill) {
      return;
    }

    setSelectedSkills((current) => {
      if (current.some((skill) => skill.id === selectedSkill.id)) {
        return current;
      }

      return [...current, { id: selectedSkill.id, name: selectedSkill.name, slug: selectedSkill.slug }];
    });
    setSelectedSkill(null);
    setSkillResetKey((current) => current + 1);
    setCurrentPage(1);
  };

  const removeSkillFilter = (skillId: number) => {
    setSelectedSkills((current) => current.filter((skill) => skill.id !== skillId));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSortValue('createdAt-desc');
    setSelectedSkill(null);
    setSelectedSkills([]);
    setSkillResetKey((current) => current + 1);
    setCurrentPage(1);
  };

  const toggleWishlist = (job: JobPostingListItem) => {
    if (!wishlistStorageKey) {
      return;
    }

    const next = new Set(wishlistJobIds);
    const wasSaved = next.has(job.id);

    if (wasSaved) {
      next.delete(job.id);
    } else {
      next.add(job.id);
    }

    writeWishlist(wishlistStorageKey, next);
    setWishlistVersion((current) => current + 1);
    toast.success(wasSaved ? 'Removed from wishlist' : 'Saved to wishlist', {
      description: wasSaved
        ? `${job.title || 'This job'} was removed from your wishlist.`
        : `${job.title || 'This job'} was added to your wishlist.`,
    });
  };

  const handleApply = async (jobPostingId: number) => {
    if (isPublic && !session) {
      navigate(`/register?returnTo=${encodeURIComponent(`/jobs/${jobPostingId}`)}`);
      return;
    }

    if (isPublic && session?.user.role !== 'Candidate') {
      toast.danger('Candidate account required', {
        description: 'Only candidate accounts can apply to jobs.',
      });
      return;
    }

    setApplyingId(jobPostingId);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await applyToJobPosting(jobPostingId);
      toast.success('Application submitted', {
        description: 'Your application was submitted successfully.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to apply for this job';
      toast.danger('Application failed', {
        description: errorMessage,
      });
    } finally {
      setApplyingId(null);
      setAuthLoading(false);
    }
  };

  return (
    <div className="grid gap-8">
      <section className="p-0">
        <div className="mb-6">
          <h2 className="text-4xl leading-[1.15] text-foreground">Browse job postings</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            {isPublic ? 'Review active openings, then create an account when you are ready to apply.' : 'Review active openings and apply with one click when you are ready.'}
          </p>
        </div>

        <div className="mb-6 grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_158px] lg:items-center">
            <label className="grid w-full gap-2 lg:block">
              <span className="sr-only">Search jobs</span>
              <div className="relative w-full">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-500" />
                <Input
                  className="h-10 w-full pl-9"
                  fullWidth
                  placeholder="Search by job title (2+ characters)"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </label>

            <label className="grid gap-2 lg:block">
              <span className="sr-only">Sort</span>
              <Select
                selectedKey={sortValue}
                onSelectionChange={(key) => {
                  setSortValue(String(key) as SortValue);
                  setCurrentPage(1);
                }}
                fullWidth
              >
                <Select.Trigger className="h-10">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox aria-label="Sort job postings">
                    {sortOptions.map((option) => (
                      <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                        {option.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </label>

            <div className="grid grid-cols-[110px_40px] gap-2">
              <Button type="button" variant="secondary" className="h-10 w-full" onPress={filterModal.open}>
                <Filter aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Filters
                {selectedSkills.length > 0 && (
                  <span className="ml-1 rounded-full bg-[#181d26] px-2 py-0.5 text-xs text-white">{selectedSkills.length}</span>
                )}
              </Button>
              <Button
                isIconOnly
                aria-label="Reset filters"
                type="button"
                variant="ghost"
                className="h-10 w-10 min-w-10 border border-divider text-foreground-500"
                isDisabled={!hasActiveFilters}
                onPress={clearFilters}
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </Button>
            </div>
          </div>

          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSkills.map((skill) => (
                <span key={skill.id} className="status-success inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                  {skill.name}
                  <button
                    type="button"
                    aria-label={`Remove ${skill.name} filter`}
                    className="opacity-70 hover:opacity-100"
                    onClick={() => removeSkillFilter(skill.id)}
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Modal state={filterModal}>
          <Modal.Backdrop>
            <Modal.Container size="lg" placement="center" scroll="inside">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Filter jobs</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body>
                  <div className="grid gap-4">
                    <p className="text-sm leading-6 text-foreground-500">
                      Select required skills to narrow down active job postings.
                    </p>

                    <SkillAutocomplete
                      label="Required skill"
                      placeholder="Search and select a skill"
                      selectedSkill={selectedSkill}
                      resetKey={skillResetKey}
                      onSelect={setSelectedSkill}
                      excludeIds={selectedSkillIds}
                    />

                    <Button type="button" variant="primary" className="w-full sm:w-fit" isDisabled={!selectedSkill} onPress={addSkillFilter}>
                      Add skill filter
                    </Button>

                    <div className="grid gap-2">
                      <span className="text-sm font-medium text-foreground">Selected skill filters</span>
                      {selectedSkills.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                          No skill filters selected.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <span
                              key={skill.id}
                              className="status-success inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                            >
                              {skill.name}
                              <button
                                type="button"
                                aria-label={`Remove ${skill.name} filter`}
                                className="opacity-70 hover:opacity-100"
                                onClick={() => removeSkillFilter(skill.id)}
                              >
                                <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button type="button" variant="ghost" isDisabled={!hasActiveFilters} onPress={clearFilters}>
                    Clear all
                  </Button>
                  <Button type="button" variant="primary" onPress={filterModal.close}>
                    Done
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500 md:col-span-2 xl:col-span-3">
              No active jobs found.
            </div>
          ) : (
            jobs.map((job) => {
              const companyLogoUrl = getCompanyLogoUrl(job.company?.logo, job.company?.websiteUrl);
              const workLocation = formatWorkLocation(job.workLocation);
              const employmentType = formatEmploymentType(job.employmentType);
              const isWishlisted = wishlistJobIds.has(job.id);

              return (
              <article key={job.id} className="flex min-h-80 flex-col rounded-xl border border-divider bg-content1 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-11 shrink-0 items-center justify-start overflow-hidden rounded-lg text-white ${companyLogoUrl ? 'w-7' : 'w-11'}`}>
                      {companyLogoUrl ? (
                        <img
                          alt={`${job.company?.name || 'Company'} logo`}
                          className="h-7 w-7 object-contain"
                          src={companyLogoUrl}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
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
                  {!isPublic && (
                    <Button
                      isIconOnly
                      aria-label={`${isWishlisted ? 'Remove' : 'Save'} ${job.title || 'job'}`}
                      aria-pressed={isWishlisted}
                      className={[
                        'shrink-0 border',
                        isWishlisted
                          ? 'status-danger hover-status-danger'
                          : 'border-status-danger bg-content1 text-status-danger hover-status-danger',
                      ].join(' ')}
                      size="sm"
                      type="button"
                      variant="secondary"
                      onPress={() => toggleWishlist(job)}
                    >
                      <Heart aria-hidden="true" className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.8} />
                    </Button>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground-500">
                  <span className="text-status-success inline-flex items-center gap-1.5">
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
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
                        to={`${detailsBasePath}/${job.id}`}
                      >
                        View details
                        <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                      {!isPublic && (
                        <Button
                          className="bg-status-success-solid hover-status-success rounded-lg"
                          type="button"
                          variant="primary"
                          isDisabled={applyingId === job.id || isApplyBlockedByRole}
                          onPress={() => void handleApply(job.id)}
                        >
                          {applyingId === job.id ? 'Applying...' : 'Apply now'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
              );
            })
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-divider pt-4">
            <span className="text-sm text-foreground-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                aria-label="Previous page"
                type="button"
                variant="secondary"
                isDisabled={pagination.currentPage <= 1}
                onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                aria-label="Next page"
                type="button"
                variant="secondary"
                isDisabled={pagination.currentPage >= pagination.totalPages}
                onPress={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
