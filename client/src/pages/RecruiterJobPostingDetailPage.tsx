import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import {
  Button,
  Calendar,
  Card,
  Chip,
  DateField,
  DatePicker,
  Dropdown,
  Input,
  ListBox,
  Select,
  toast,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { ArrowLeft, ChevronDown, Pause, Play, Plus, Send, Trash2, X } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  deleteJobPosting,
  getJobPostingInterviewActivities,
  type InterviewActivityTemplatePayload,
  getJobPostingDetail,
  updateJobPosting,
  type JobPostingDetail,
  type JobPostingEmploymentType,
  type JobPostingStatus,
  type JobPostingUpdatePayload,
  type JobPostingWorkLocation,
} from '../lib/job-postings-api';
import { getSkillCategories, type Skill, type SkillCategory } from '../lib/skills-api';
import { formatDateTime } from '../lib/date-format';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { InterviewActivityTemplateEditor } from '../components/InterviewActivityTemplateEditor';

type SelectedSkill = {
  id: number;
  name: string;
  requiresYearsOfExperience: boolean;
  yearsOfExperience: number | null;
};

type PostingFormState = {
  title: string;
  shortDescription: string;
  description: string;
  workLocation: JobPostingWorkLocation | '';
  employmentType: JobPostingEmploymentType | '';
  salaryRange: string;
  expiresAt: string;
};

const workLocationOptions: Array<{ key: JobPostingWorkLocation; label: string }> = [
  { key: 'Remote', label: 'Remote' },
  { key: 'Hybrid', label: 'Hybrid' },
  { key: 'OnSite', label: 'On-site' },
];

const employmentTypeOptions: Array<{ key: JobPostingEmploymentType; label: string }> = [
  { key: 'FullTime', label: 'Full-time' },
  { key: 'PartTime', label: 'Part-time' },
  { key: 'Contract', label: 'Contract' },
  { key: 'Internship', label: 'Internship' },
  { key: 'Temporary', label: 'Temporary' },
  { key: 'Other', label: 'Other' },
];

const statusColor = (status?: string) => {
  if (status === 'Active') return 'success';
  if (status === 'PendingApproval') return 'warning';
  if (status === 'Rejected') return 'danger';
  if (status === 'Draft') return 'default';
  if (status === 'Paused') return 'warning';
  return 'accent';
};

const formatStatusLabel = (status?: string | null) => {
  if (!status) return 'Draft';
  return status.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const PostingDatePicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <DatePicker
    className="w-full"
    aria-label="Expires at"
    value={value ? parseDate(value) : null}
    onChange={(dateValue) => onChange(dateValue?.toString() ?? '')}
    minValue={parseDate(todayIso())}
  >
    <DateField.Group fullWidth className="min-h-[42px] rounded-lg">
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
      <DateField.Suffix>
        <DatePicker.Trigger>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
      </DateField.Suffix>
    </DateField.Group>
    <DatePicker.Popover className="!w-[340px] !min-w-[340px] max-w-[calc(100vw-2rem)]">
      <Calendar className="!w-[340px] max-w-full">
        <Calendar.Header>
          <Calendar.NavButton slot="previous" />
          <Calendar.YearPickerTrigger>
            <Calendar.YearPickerTriggerHeading />
            <Calendar.YearPickerTriggerIndicator />
          </Calendar.YearPickerTrigger>
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>
            {(date) => (
              <Calendar.Cell date={date}>
                {({ formattedDate }) => (
                  <>
                    {formattedDate}
                    <Calendar.CellIndicator />
                  </>
                )}
              </Calendar.Cell>
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
        <Calendar.YearPickerGrid>
          <Calendar.YearPickerGridBody>
            {({ year }) => <Calendar.YearPickerCell year={year} />}
          </Calendar.YearPickerGridBody>
        </Calendar.YearPickerGrid>
      </Calendar>
    </DatePicker.Popover>
  </DatePicker>
);

const toFormState = (posting: JobPostingDetail): PostingFormState => ({
  title: posting.title || '',
  shortDescription: posting.shortDescription || '',
  description: posting.description || '',
  workLocation: (posting.workLocation as JobPostingWorkLocation | null) || '',
  employmentType: (posting.employmentType as JobPostingEmploymentType | null) || '',
  salaryRange: posting.salaryRange || '',
  expiresAt: posting.expiresAt ? posting.expiresAt.slice(0, 10) : '',
});

const toSelectedSkills = (posting: JobPostingDetail): SelectedSkill[] =>
  (posting.skills || []).map((skill) => ({
    id: skill.id,
    name: skill.name,
    requiresYearsOfExperience: skill.yoe !== null && skill.yoe !== undefined,
    yearsOfExperience: skill.yoe ?? null,
  }));

export const RecruiterJobPostingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobPostingDetail | null>(null);
  const [form, setForm] = useState<PostingFormState>({
    title: '',
    shortDescription: '',
    description: '',
    workLocation: '',
    employmentType: '',
    salaryRange: '',
    expiresAt: '',
  });
  const [skillCatalogCount, setSkillCatalogCount] = useState(0);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedYears, setSelectedYears] = useState('1');
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [interviewActivities, setInterviewActivities] = useState<InterviewActivityTemplatePayload[]>([]);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [skillResetKey, setSkillResetKey] = useState(0);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmStatusAction, setConfirmStatusAction] = useState<JobPostingStatus | null>(null);

  const postingId = Number(id);
  const isBusy = loading || saving;
  const activeSkillCategory = skillCategories.find((category) => category.id === selectedCategoryId);
  const visibleSkillCategories = skillCategories.slice(0, 6);
  const hiddenSkillCategoryCount = Math.max(skillCategories.length - visibleSkillCategories.length, 0);
  const hiddenSkillCategories = skillCategories.slice(visibleSkillCategories.length);
  const filteredHiddenSkillCategories = hiddenSkillCategories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );
  const canPublish = detail?.status === 'Draft' || detail?.status === 'Rejected';
  const isPendingApproval = detail?.status === 'PendingApproval';
  const canPause = detail?.status === 'Active';
  const canResume = detail?.status === 'Paused';
  const canDelete = detail?.status !== 'Active';

  const updateField = <K extends keyof PostingFormState>(key: K, value: PostingFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loadDetail = async () => {
    if (!Number.isFinite(postingId)) {
      setError('Invalid job posting id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [response, activityResponse] = await Promise.all([
        getJobPostingDetail(postingId, ['skills', 'statusHistory', 'company']),
        getJobPostingInterviewActivities(postingId),
      ]);
      setDetail(response.data);
      setForm(toFormState(response.data));
      setSelectedSkills(toSelectedSkills(response.data));
      setInterviewActivities(
        activityResponse.data.map((activity, index) => ({
          title: activity.title,
          description: activity.description,
          orderIndex: index,
          isRequired: activity.isRequired,
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job posting');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDetail(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postingId]);

  useEffect(() => {
    let cancelled = false;

    const loadSkillCategories = async () => {
      try {
        const response = await getSkillCategories();
        if (!cancelled) {
          setSkillCategories(response.data);
        }
      } catch {
        if (!cancelled) {
          setSkillCategories([]);
        }
      }
    };

    void loadSkillCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const addSkill = () => {
    const skill = selectedSkill;

    if (!skill) {
      setSkillMessage('Select a skill first.');
      return;
    }

    const requiresYearsOfExperience = skill.requiresYearsOfExperience;
    const years = requiresYearsOfExperience ? Number(selectedYears) : null;

    if (requiresYearsOfExperience && (!Number.isFinite(Number(selectedYears)) || Number(selectedYears) < 0)) {
      setSkillMessage('Years of experience must be zero or greater.');
      return;
    }

    setSelectedSkills((current) => {
      if (current.some((entry) => entry.id === skill.id)) {
        return current;
      }

      return [
        ...current,
        {
          id: skill.id,
          name: skill.name,
          requiresYearsOfExperience,
          yearsOfExperience: years,
        },
      ];
    });
    setSkillMessage(null);
    setSelectedSkill(null);
    setSkillResetKey((current) => current + 1);
  };

  const removeSkill = (skillId: number) => {
    setSelectedSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  const buildPayload = (nextStatus?: JobPostingStatus): JobPostingUpdatePayload => ({
    title: form.title.trim() || undefined,
    shortDescription: form.shortDescription.trim() || undefined,
    description: form.description.trim() || undefined,
    workLocation: form.workLocation || undefined,
    employmentType: form.employmentType || undefined,
    salaryRange: form.salaryRange.trim() || undefined,
    expiresAt: form.expiresAt || undefined,
    status: nextStatus,
    skills: selectedSkills.map((skill) => ({
      skillId: skill.id,
      yoe: skill.yearsOfExperience ?? undefined,
    })),
    interviewActivities: interviewActivities
      .map((activity, index) => ({
        title: activity.title.trim(),
        description: activity.description?.trim() || null,
        orderIndex: index,
        isRequired: activity.isRequired ?? true,
      }))
      .filter((activity) => activity.title.length > 0),
  });

  const savePosting = async (nextStatus?: JobPostingStatus) => {
    if (!detail) {
      return;
    }

    setSaving(true);
    setSkillMessage(null);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      const response = await updateJobPosting(detail.id, buildPayload(nextStatus));
      setDetail(response.data);
      setForm(toFormState(response.data));
      setSelectedSkills(toSelectedSkills(response.data));
      toast.success(nextStatus === 'PendingApproval' ? 'Posting submitted for approval.' : 'Posting updated successfully.');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to update job posting';
      setError(message);
      toast.danger(nextStatus === 'PendingApproval' ? 'Unable to submit posting' : 'Unable to update posting', {
        description: message,
      });
    } finally {
      setSaving(false);
      setAuthLoading(false);
    }
  };

  const updatePostingStatus = async (nextStatus: JobPostingStatus) => {
    if (!detail) {
      return;
    }

    setSaving(true);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      const response = await updateJobPosting(detail.id, { status: nextStatus });
      setDetail(response.data);
      setForm(toFormState(response.data));
      setSelectedSkills(toSelectedSkills(response.data));
      toast.success(
        nextStatus === 'Paused'
          ? 'Posting paused.'
          : nextStatus === 'Active'
            ? 'Posting resumed.'
            : 'Posting status updated.',
      );
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : 'Unable to update job posting status';
      setError(message);
      toast.danger(
        nextStatus === 'Paused'
          ? 'Unable to pause posting'
          : nextStatus === 'Active'
            ? 'Unable to resume posting'
            : 'Unable to update posting status',
        { description: message },
      );
    } finally {
      setSaving(false);
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await savePosting();
  };

  const handleDelete = async () => {
    if (!detail) {
      return;
    }

    setSaving(true);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await deleteJobPosting(detail.id);
      navigate('/panel/job-postings', { replace: true });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete job posting';
      setError(message);
      toast.danger('Unable to delete posting', { description: message });
    } finally {
      setSaving(false);
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
          <Button className="rounded-lg" type="button" variant="primary" onPress={() => void loadDetail()}>
            Retry
          </Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/job-postings">
            Back to postings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <ConfirmDialog
        open={confirmPublishOpen}
        title="Publish for approval?"
        description="This will submit the posting for admin review. Make sure the role details, expiry date, and required skills are ready before continuing."
        confirmLabel="Publish for approval"
        loading={saving}
        onCancel={() => setConfirmPublishOpen(false)}
        onConfirm={() => {
          setConfirmPublishOpen(false);
          void savePosting('PendingApproval');
        }}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete job posting?"
        description="This will permanently delete this job posting. This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="danger"
        loading={saving}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          void handleDelete();
        }}
      />

      <ConfirmDialog
        open={confirmStatusAction !== null}
        title={confirmStatusAction === 'Paused' ? 'Pause job posting?' : 'Resume job posting?'}
        description={
          confirmStatusAction === 'Paused'
            ? 'This will remove the posting from public job browsing until you resume it.'
            : 'This will make the posting visible to candidates again.'
        }
        confirmLabel={confirmStatusAction === 'Paused' ? 'Pause posting' : 'Resume posting'}
        loading={saving}
        onCancel={() => setConfirmStatusAction(null)}
        onConfirm={() => {
          const nextStatus = confirmStatusAction;
          setConfirmStatusAction(null);
          if (nextStatus) {
            void updatePostingStatus(nextStatus);
          }
        }}
      />

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Chip className="rounded-md" color={statusColor(detail?.status)} size="sm" variant="soft">
              {formatStatusLabel(detail?.status)}
            </Chip>
            <span className="text-sm text-foreground-500">Updated {formatDateTime(detail?.updatedAt)}</span>
          </div>
          <h2 className="mt-3 text-4xl leading-[1.1] text-foreground">{detail?.title || 'Untitled role'}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-500">
            {detail?.company?.name || 'Unknown company'}
            {detail?.expiresAt ? ` · Expires ${formatDateTime(detail.expiresAt)}` : ''}
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground"
          to="/panel/job-postings"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to postings
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <Card className="rounded-xl border border-divider bg-content1 p-6 shadow-none sm:p-8">
            <div>
              <h3 className="text-2xl text-foreground">Posting details</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-500">
                Update the public role details candidates see before applying.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Title <span className="text-danger">*</span>
                </span>
                <Input
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Senior Frontend Engineer"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Location</span>
                <Select
                  selectedKey={form.workLocation || null}
                  onSelectionChange={(key) => updateField('workLocation', (key ? String(key) : '') as JobPostingWorkLocation | '')}
                  fullWidth
                >
                  <Select.Trigger className="h-10 rounded-lg text-sm">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox aria-label="Location options">
                      {workLocationOptions.map((option) => (
                        <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                          {option.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Employment type</span>
                <Select
                  selectedKey={form.employmentType || null}
                  onSelectionChange={(key) => updateField('employmentType', (key ? String(key) : '') as JobPostingEmploymentType | '')}
                  fullWidth
                >
                  <Select.Trigger className="h-10 rounded-lg text-sm">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox aria-label="Employment type options">
                      {employmentTypeOptions.map((option) => (
                        <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                          {option.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Salary range</span>
                <Input
                  value={form.salaryRange}
                  onChange={(event) => updateField('salaryRange', event.target.value)}
                  placeholder="$120k - $160k"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Expires at</span>
                <PostingDatePicker value={form.expiresAt} onChange={(value) => updateField('expiresAt', value)} />
              </div>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-medium text-foreground">Short description</span>
              <Input
                value={form.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                placeholder="One or two sentences for the postings list"
                maxLength={120}
              />
            </label>

            <div className="mt-4 grid gap-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <RichTextEditor
                value={form.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Add responsibilities, requirements, benefits, and hiring process details..."
              />
            </div>
          </Card>

          <Card className="rounded-xl border border-divider bg-content1 p-6 shadow-none sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl text-foreground">Required skills</h3>
                <p className="mt-1 text-sm leading-6 text-foreground-500">
                  Add the skills candidates need for this posting.
                </p>
              </div>
              <span className="rounded-full border border-[#a8d8c4]/50 bg-[#a8d8c4]/10 px-3 py-1 text-sm text-foreground-600">
                {skillCatalogCount} available
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <span className="text-sm font-medium text-foreground-600">Filter by category</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={[
                    'cursor-pointer rounded-[4px] border px-3 py-1.5 !text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
                    selectedCategoryId === null
                      ? 'border-[var(--brand)] bg-brand text-brand-foreground'
                      : 'border-divider/70 bg-content1 text-foreground-700 hover:bg-content2',
                  ].join(' ')}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSkillMessage(null);
                  }}
                >
                  All
                </button>
                {visibleSkillCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={[
                      'cursor-pointer rounded-[4px] border px-3 py-1.5 !text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
                      selectedCategoryId === category.id
                        ? 'border-[var(--brand)] bg-brand text-brand-foreground'
                        : 'border-divider/70 bg-content1 text-foreground-700 hover:bg-content2',
                    ].join(' ')}
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSkillMessage(null);
                    }}
                  >
                    {category.name}
                  </button>
                ))}
                {hiddenSkillCategoryCount > 0 && (
                  <Dropdown>
                    <Dropdown.Trigger className="inline-flex cursor-pointer items-center gap-2 rounded-[4px] border border-divider bg-content1 px-3 py-1.5 !text-[14px] font-medium text-foreground-500 transition-colors hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20">
                      <span className="!text-[14px]">+{hiddenSkillCategoryCount} more</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Dropdown.Trigger>
                    <Dropdown.Popover placement="bottom start">
                      <div className="w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-divider bg-content1 p-3 shadow-lg">
                        <Input
                          value={categorySearch}
                          onChange={(event) => setCategorySearch(event.target.value)}
                          placeholder="Search categories..."
                          className="h-10 text-sm"
                        />
                        <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-auto">
                          {filteredHiddenSkillCategories.length === 0 ? (
                            <span className="px-1 py-2 text-sm text-foreground-500">No categories found.</span>
                          ) : (
                            filteredHiddenSkillCategories.map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                className={[
                                  'cursor-pointer rounded-[4px] border px-3 py-1.5 !text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
                                  selectedCategoryId === category.id
                                    ? 'border-[var(--brand)] bg-brand text-brand-foreground'
                                    : 'border-divider/70 bg-content1 text-foreground-700 hover:bg-content2',
                                ].join(' ')}
                                onClick={() => {
                                  setSelectedCategoryId(category.id);
                                  setSkillMessage(null);
                                }}
                              >
                                {category.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </Dropdown.Popover>
                  </Dropdown>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_auto] lg:items-end">
              <SkillAutocomplete
                label="Skill"
                placeholder='Search skills in "All"...'
                selectedSkill={selectedSkill}
                resetKey={skillResetKey}
                categoryId={selectedCategoryId}
                categoryName={activeSkillCategory?.name ?? null}
                showCategoryFilter={false}
                onSelect={setSelectedSkill}
                onResultsChange={setSkillCatalogCount}
                excludeIds={selectedSkills.map((skill) => skill.id)}
              />

              {selectedSkill?.requiresYearsOfExperience === false ? (
                <div className="grid gap-3">
                  <span className="text-sm font-medium text-foreground-700">Years</span>
                  <div className="flex h-10 items-center rounded-lg bg-content2 px-3 text-sm text-foreground-500">
                    Not required
                  </div>
                </div>
              ) : (
                <label className="grid gap-3">
                  <span className="text-sm font-medium text-foreground-700">Years</span>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    value={selectedYears}
                    onChange={(event) => setSelectedYears(event.target.value)}
                  />
                </label>
              )}

              <div className="grid gap-3">
                <span aria-hidden="true" className="text-sm font-medium text-transparent">
                  Add
                </span>
                <Button
                  className="h-10 rounded-lg border border-[#f5e9d4] bg-[#f5e9d4] px-5 text-[#181d26] hover:bg-[#eadcc4]"
                  type="button"
                  variant="primary"
                  onPress={addSkill}
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </span>
                </Button>
              </div>
            </div>

            {skillMessage && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
                {skillMessage}
              </div>
            )}

            <div className="mt-5 grid gap-4 border-t border-divider pt-5">
              <span className="text-base font-semibold text-foreground-600">
                Selected skills ({selectedSkills.length})
              </span>
              {selectedSkills.length === 0 ? (
                <div className="rounded-lg border border-dashed border-divider bg-content2/50 px-4 py-3 text-sm text-foreground-500">
                  No required skills selected.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex max-w-full items-center gap-3 rounded-[12px] border border-divider bg-content1 px-4 py-2 text-[14px] text-foreground shadow-sm"
                    >
                      <span className="truncate">
                        <span className="font-medium">{skill.name}</span>
                        <span className="font-medium text-foreground-500">
                          {skill.yearsOfExperience === null ? ' · no YOE' : ` · ${skill.yearsOfExperience} yrs`}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="grid h-5 w-5 shrink-0 cursor-pointer place-items-center text-foreground-400 transition-colors hover:text-foreground"
                        aria-label={`Remove ${skill.name}`}
                        onClick={() => removeSkill(skill.id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-xl border border-divider bg-content1 p-6 shadow-none sm:p-8">
            <InterviewActivityTemplateEditor
              activities={interviewActivities}
              onChange={setInterviewActivities}
            />
          </Card>

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
              {error}
            </div>
          )}
        </form>

        <aside className="grid content-start gap-4 xl:sticky xl:top-6">
          <Card className="rounded-xl border border-divider bg-content1 p-5 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl text-foreground">Review status</h3>
                <p className="mt-1 text-sm text-foreground-500">Status is controlled by workflow actions.</p>
              </div>
              <Chip className="rounded-md" color={statusColor(detail?.status)} size="sm" variant="soft">
                {formatStatusLabel(detail?.status)}
              </Chip>
            </div>

            {isPendingApproval && (
              <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning-700">
                Awaiting admin approval.
              </div>
            )}

            <div className="mt-5 grid gap-3">
              <Button className="rounded-lg" type="submit" variant="primary" isDisabled={saving} onPress={() => void savePosting()}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
              {canPublish && (
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="secondary"
                  onPress={() => setConfirmPublishOpen(true)}
                  isDisabled={isBusy}
                >
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Publish for approval
                  </span>
                </Button>
              )}
              {canPause && (
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="secondary"
                  onPress={() => setConfirmStatusAction('Paused')}
                  isDisabled={isBusy}
                >
                  <span className="inline-flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause posting
                  </span>
                </Button>
              )}
              {canResume && (
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="secondary"
                  onPress={() => setConfirmStatusAction('Active')}
                  isDisabled={isBusy}
                >
                  <span className="inline-flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume posting
                  </span>
                </Button>
              )}
              {canDelete && (
                <Button
                  className="rounded-lg"
                  type="button"
                  variant="outline"
                  onPress={() => setConfirmDeleteOpen(true)}
                  isDisabled={isBusy}
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete posting
                  </span>
                </Button>
              )}
            </div>
          </Card>

          <Card className="rounded-xl border border-divider bg-content1 p-5 shadow-none">
            <h3 className="text-xl text-foreground">Company</h3>
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <span className="block text-foreground-500">Name</span>
                <span className="font-medium text-foreground">{detail?.company?.name || 'Unknown company'}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Website</span>
                <span className="break-all text-foreground">{detail?.company?.websiteUrl || 'Not provided'}</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border border-divider bg-content1 p-5 shadow-none">
            <h3 className="text-xl text-foreground">Status history</h3>
            <div className="mt-4 grid gap-3">
              {(detail?.statusHistory || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-divider bg-content2/50 p-4 text-sm text-foreground-500">
                  No status history available.
                </div>
              ) : (
                detail?.statusHistory?.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-divider bg-content2 p-3 text-sm text-foreground">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{formatStatusLabel(entry.status)}</strong>
                      <span className="text-xs text-foreground-500">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    {entry.reason && <p className="mt-2 leading-5 text-foreground-500">{entry.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
};
