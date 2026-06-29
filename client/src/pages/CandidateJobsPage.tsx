import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, ListBox, Modal, Select, toast, useOverlayState } from '@heroui/react';
import { BriefcaseBusiness, Building2, CalendarDays, ChevronRight, Filter, Heart, Search, X } from 'lucide-react';
import { getActiveJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { applyToJobPosting } from '../lib/job-applications-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import type { ApiPagination } from '../lib/panel-api';
import type { Skill } from '../lib/skills-api';

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

const pageSize = 9;

export const CandidateJobsPage = () => {
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
  const filterModal = useOverlayState();
  const selectedSort = sortOptions.find((option) => option.value === sortValue) ?? sortOptions[0];
  const selectedSkillIds = useMemo(() => selectedSkills.map((skill) => skill.id), [selectedSkills]);
  const hasFilters = search.trim().length > 0 || selectedSkills.length > 0 || sortValue !== 'createdAt-desc';

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

  const handleApply = async (jobPostingId: number) => {
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
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-4xl leading-[1.15] text-foreground">Browse job postings</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Review active openings and apply with one click when you are ready.
          </p>
        </div>

        <div className="mb-6 grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_110px] lg:items-center">
            <label className="grid w-full gap-2 lg:block">
              <span className="sr-only">Search jobs</span>
              <div className="relative w-full">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-500" />
                <Input
                  className="w-full pl-9"
                  fullWidth
                  placeholder="Search by job title"
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
                <Select.Trigger>
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

            <Button type="button" variant="secondary" className="w-full" onPress={filterModal.open}>
              <Filter aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Filters
              {selectedSkills.length > 0 && (
                <span className="ml-1 rounded-full bg-[#181d26] px-2 py-0.5 text-xs text-white">{selectedSkills.length}</span>
              )}
            </Button>
          </div>

          {(selectedSkills.length > 0 || hasFilters) && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSkills.map((skill) => (
                <span key={skill.id} className="inline-flex items-center gap-2 rounded-full border border-[#9edec5] bg-[#e8f8f1] px-3 py-1.5 text-xs font-medium text-[#19734f]">
                  {skill.name}
                  <button
                    type="button"
                    aria-label={`Remove ${skill.name} filter`}
                    className="text-[#19734f]/70 hover:text-[#19734f]"
                    onClick={() => removeSkillFilter(skill.id)}
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </span>
              ))}

              {hasFilters && (
                <Button type="button" variant="ghost" className="px-2 text-foreground-500" onPress={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {search.trim().length === 1 && (
            <div className="text-sm text-foreground-500">Type at least 2 characters to search</div>
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
                              className="inline-flex items-center gap-2 rounded-full border border-[#9edec5] bg-[#e8f8f1] px-3 py-1.5 text-xs font-medium text-[#19734f]"
                            >
                              {skill.name}
                              <button
                                type="button"
                                aria-label={`Remove ${skill.name} filter`}
                                className="text-[#19734f]/70 hover:text-[#19734f]"
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
                  <Button type="button" variant="ghost" onPress={clearFilters}>
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
            jobs.map((job) => (
              <article key={job.id} className="flex min-h-80 flex-col rounded-xl border border-divider bg-content1 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#181d26] text-white">
                      <Building2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-foreground-500">{job.company?.name || 'Unknown company'}</p>
                      <h3 className="truncate text-base font-medium text-foreground">{job.title || 'Untitled role'}</h3>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    aria-label={`Save ${job.title || 'job'}`}
                    className="shrink-0 border border-[#f2a6a6] bg-content1 text-[#c24141] hover:bg-[#fff1f1]"
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Heart aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
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

                <div className="mt-auto pt-6">
                  <div className="border-t border-divider pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
                        to={`/panel/jobs/${job.id}`}
                      >
                        View details
                        <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                      <Button
                        className="rounded-lg bg-[#19734f] text-white hover:bg-[#145f42]"
                        type="button"
                        variant="primary"
                        isDisabled={applyingId === job.id}
                        onPress={() => void handleApply(job.id)}
                      >
                        {applyingId === job.id ? 'Applying...' : 'Apply now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-divider pt-4">
            <span className="text-sm text-foreground-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                isDisabled={pagination.currentPage <= 1}
                onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                isDisabled={pagination.currentPage >= pagination.totalPages}
                onPress={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
