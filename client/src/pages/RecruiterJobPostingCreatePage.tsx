import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Calendar, Card, DateField, DatePicker, Dropdown, Input, ListBox, Select, toast } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ChevronDown, FilePlus2, MapPin, Plus, Send, WalletCards, X } from 'lucide-react';
import { useSetAtom } from 'jotai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RichTextEditor } from '../components/RichTextEditor';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import {
  createJobPosting,
  type InterviewActivityTemplatePayload,
  type JobPostingCreatePayload,
  type JobPostingEmploymentType,
  type JobPostingWorkLocation,
} from '../lib/job-postings-api';
import { getSkillCategories, type Skill, type SkillCategory } from '../lib/skills-api';
import { formatDate } from '../lib/date-format';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { InterviewActivityTemplateEditor } from '../components/InterviewActivityTemplateEditor';
import { FieldRequirementLegend, FieldRequirementMark } from '../components/FieldRequirementMark';

type RecruiterJobPostingCreatePageProps = {
  loading: boolean;
};

type SelectedSkill = {
  id: number;
  name: string;
  requiresYearsOfExperience: boolean;
  yearsOfExperience: number | null;
};

type CreateStep = 'basic' | 'skills' | 'process' | 'preview';

type PostingLogisticsDraft = {
  workLocation: JobPostingWorkLocation | '';
  employmentType: JobPostingEmploymentType | '';
  salaryRange: string;
};

type PostingField = 'title' | 'shortDescription' | 'description' | 'expiresAt';
type PostingFieldErrors = Partial<Record<PostingField, string>>;

const steps: Array<{ key: CreateStep; label: string }> = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'skills', label: 'Required Skills' },
  { key: 'process', label: 'Interview Process' },
  { key: 'preview', label: 'Preview' },
];

const emptyForm: JobPostingCreatePayload = {
  title: '',
  shortDescription: '',
  description: '',
  status: 'Draft',
  expiresAt: '',
  skills: [],
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

const todayIso = () => new Date().toISOString().slice(0, 10);

const fallbackText = (value: string | undefined | null, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

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

export const RecruiterJobPostingCreatePage = ({ loading }: RecruiterJobPostingCreatePageProps) => {
  const navigate = useNavigate();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [form, setForm] = useState<JobPostingCreatePayload>(emptyForm);
  const [logistics, setLogistics] = useState<PostingLogisticsDraft>({
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '',
  });
  const [fieldErrors, setFieldErrors] = useState<PostingFieldErrors>({});
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [skillCatalogCount, setSkillCatalogCount] = useState(0);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedYears, setSelectedYears] = useState('1');
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [interviewActivities, setInterviewActivities] = useState<InterviewActivityTemplatePayload[]>([]);
  const [skillResetKey, setSkillResetKey] = useState(0);
  const [activeStep, setActiveStep] = useState<CreateStep>('basic');
  const activeStepIndex = steps.findIndex((step) => step.key === activeStep);
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === steps.length - 1;
  const activeSkillCategory = skillCategories.find((category) => category.id === selectedCategoryId);
  const visibleSkillCategories = skillCategories.slice(0, 6);
  const hiddenSkillCategoryCount = Math.max(skillCategories.length - visibleSkillCategories.length, 0);
  const hiddenSkillCategories = skillCategories.slice(visibleSkillCategories.length);
  const filteredHiddenSkillCategories = hiddenSkillCategories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );

  const updateField = <K extends keyof JobPostingCreatePayload>(key: K, value: JobPostingCreatePayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateLogisticsField = <K extends keyof PostingLogisticsDraft>(
    key: K,
    value: PostingLogisticsDraft[K],
  ) => {
    setLogistics((current) => ({ ...current, [key]: value }));
  };

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

  const goToPreviousStep = () => {
    const previousStep = steps[Math.max(activeStepIndex - 1, 0)];
    setSkillMessage(null);
    setActiveStep(previousStep.key);
  };

  const goToNextStep = () => {
    const nextStep = steps[Math.min(activeStepIndex + 1, steps.length - 1)];
    setSkillMessage(null);
    setActiveStep(nextStep.key);
  };

  const submitPosting = async (status: JobPostingCreatePayload['status']) => {
    const payload = {
      ...form,
      status,
      title: form.title.trim(),
      shortDescription: form.shortDescription?.trim() || undefined,
      description: form.description?.trim() || undefined,
      workLocation: logistics.workLocation || undefined,
      employmentType: logistics.employmentType || undefined,
      salaryRange: logistics.salaryRange.trim() || undefined,
      expiresAt: form.expiresAt || undefined,
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
    };

    const response = await createJobPosting(payload);
    navigate(`/panel/job-postings/${response.data.id}`);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (form.title.trim().length < 3) {
      setActiveStep('basic');
      setFieldErrors((current) => ({ ...current, title: 'Enter a title with at least 3 characters.' }));
      toast.danger('Draft could not be saved', {
        description: 'Add a job title with at least 3 characters. Other fields can be completed later.',
      });
      return;
    }

    setAuthLoading(true);

    try {
      await submitPosting('Draft');
    } catch (submitError) {
      toast.danger('Draft could not be saved', {
        description: submitError instanceof Error
          ? submitError.message
          : 'Check the posting details and try again.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const publishPosting = async () => {
    setAuthError(null);

    const nextFieldErrors: PostingFieldErrors = {};
    const title = form.title.trim();
    const shortDescription = form.shortDescription?.trim() ?? '';
    const description = form.description?.trim() ?? '';

    if (title.length < 10) {
      nextFieldErrors.title = 'Enter a title with at least 10 characters.';
    }

    if (!shortDescription) {
      nextFieldErrors.shortDescription = 'Add a short description before publishing for approval.';
    } else if (shortDescription.length > 80) {
      nextFieldErrors.shortDescription = 'Keep the short description to 80 characters or fewer.';
    }

    if (description.length < 60) {
      nextFieldErrors.description = 'Add a full job description with at least 60 characters.';
    }

    if (!form.expiresAt) {
      nextFieldErrors.expiresAt = 'Choose an application closing date before publishing for approval.';
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setActiveStep('basic');
      const fieldLabels: Record<PostingField, string> = {
        title: 'title',
        shortDescription: 'short description',
        description: 'description',
        expiresAt: 'closing date',
      };
      const invalidFields = (Object.keys(nextFieldErrors) as PostingField[]).map((field) => fieldLabels[field]);
      toast.danger('Posting is not ready for approval', {
        description: `Complete or correct: ${invalidFields.join(', ')}. You can still save it as a draft.`,
      });
      return;
    }

    if (selectedSkills.length === 0) {
      setActiveStep('skills');
      setSkillMessage('Add at least one required skill before publishing for approval.');
      toast.danger('Posting is not ready for approval', {
        description: 'Add at least one required skill. You can still save the posting as a draft.',
      });
      return;
    }

    setAuthLoading(true);

    try {
      await submitPosting('PendingApproval');
    } catch (submitError) {
      toast.danger('Posting could not be submitted for approval', {
        description: submitError instanceof Error
          ? submitError.message
          : 'Check the required posting details and try again.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <section className="pt-6 sm:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-4xl leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">
              Add a job posting
            </h2>
            <p className="mt-4 text-sm leading-7 text-foreground-500">
              Create the core posting details first. You can save a draft now, then add required skills before submitting for approval.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onPress={() => navigate('/panel/job-postings')}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to postings
            </span>
          </Button>
        </div>
      </section>

      <form className="grid gap-5" onSubmit={onSubmit}>
        <Card className="border border-divider shadow-none">
          <Card.Content className="grid gap-0 p-0 lg:grid-cols-[260px_minmax(0,1fr)]">
            <nav className="border-b border-divider p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="grid gap-2 lg:sticky lg:top-6">
                {steps.map((step, index) => {
                  const isActive = activeStep === step.key;
                  const isComplete = activeStepIndex > index;

                  return (
                    <Button
                      key={step.key}
                      type="button"
                      variant="ghost"
                      className={[
                        'h-auto w-full justify-start rounded-lg px-3 py-3 text-left',
                        isActive ? 'bg-content2' : 'bg-transparent',
                      ].join(' ')}
                      onPress={() => {
                        setSkillMessage(null);
                        setActiveStep(step.key);
                      }}
                    >
                      <span className="flex w-full items-center gap-3">
                        <span
                          className={[
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-medium transition-colors',
                            isActive || isComplete
                              ? 'border-[var(--brand)] bg-brand text-brand-foreground'
                              : 'border-divider bg-content1 text-foreground',
                          ].join(' ')}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium">{step.label}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </nav>

            <div className="grid gap-6 p-6 sm:p-8">
              {activeStep === 'basic' && (
                <>
              <div>
                <h3 className="text-2xl text-foreground">Posting details</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-500">
                  Keep the short description concise. Use the markdown editor for the full role details.
                </p>
                <FieldRequirementLegend />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Title <FieldRequirementMark level="draft" /></span>
                  <Input
                    value={form.title}
                    onChange={(event) => {
                      updateField('title', event.target.value);
                      setFieldErrors((current) => ({ ...current, title: undefined }));
                    }}
                    placeholder="Senior Frontend Engineer"
                  />
                  {fieldErrors.title && <span className="text-xs text-danger">{fieldErrors.title}</span>}
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Location</span>
                  <Select
                    selectedKey={logistics.workLocation || null}
                    onSelectionChange={(key) => {
                      updateLogisticsField('workLocation', (key ? String(key) : '') as JobPostingWorkLocation | '');
                    }}
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

              <div className="grid gap-4 lg:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Employment type</span>
                  <Select
                    selectedKey={logistics.employmentType || null}
                    onSelectionChange={(key) => {
                      updateLogisticsField(
                        'employmentType',
                        (key ? String(key) : '') as JobPostingEmploymentType | '',
                      );
                    }}
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
                    value={logistics.salaryRange}
                    onChange={(event) => updateLogisticsField('salaryRange', event.target.value)}
                    placeholder="$120k - $160k"
                  />
                </label>

                <div className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Expires at <FieldRequirementMark level="approval" /></span>
                  <PostingDatePicker
                    value={form.expiresAt ?? ''}
                    onChange={(value) => {
                      updateField('expiresAt', value);
                      setFieldErrors((current) => ({ ...current, expiresAt: undefined }));
                    }}
                  />
                  {fieldErrors.expiresAt && <span className="text-xs text-danger">{fieldErrors.expiresAt}</span>}
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Short description <FieldRequirementMark level="approval" /></span>
                <Input
                  value={form.shortDescription ?? ''}
                  onChange={(event) => {
                    updateField('shortDescription', event.target.value);
                    setFieldErrors((current) => ({ ...current, shortDescription: undefined }));
                  }}
                  placeholder="One or two sentences for the postings list"
                  maxLength={80}
                />
                <span className={fieldErrors.shortDescription ? 'text-xs text-danger' : 'text-xs text-foreground-500'}>
                  {fieldErrors.shortDescription ?? `${form.shortDescription?.length ?? 0}/80 characters`}
                </span>
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Description <FieldRequirementMark level="approval" /></span>
                <RichTextEditor
                  value={form.description ?? ''}
                  onChange={(value) => {
                    updateField('description', value);
                    setFieldErrors((current) => ({ ...current, description: undefined }));
                  }}
                  placeholder="Add responsibilities, requirements, benefits, and hiring process details..."
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {fieldErrors.description && <span className="text-xs text-danger">{fieldErrors.description}</span>}
                  <span
                    className={`ml-auto ${form.description?.trim().length && form.description.trim().length >= 60 ? 'text-xs text-foreground-500' : 'text-xs text-warning-700'}`}
                  >
                    {form.description?.trim().length ?? 0} characters · 60 minimum for approval
                  </span>
                </div>
              </div>
                </>
              )}

              {activeStep === 'skills' && (
              <div className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl text-foreground">Required skills <FieldRequirementMark level="approval" /></h3>
                    <p className="mt-1 text-sm leading-6 text-foreground-500">
                      Add the skills candidates need for this posting.
                    </p>
                  </div>
                  <span className="rounded-full border border-[#a8d8c4]/50 bg-[#a8d8c4]/10 px-3 py-1 text-sm text-foreground-600">
                    {skillCatalogCount} available
                  </span>
                </div>

                <div className="grid gap-3">
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

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_auto] lg:items-end">
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
                  <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
                    {skillMessage}
                  </div>
                )}

                <div className="grid gap-4 border-t border-divider pt-5">
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
              </div>
              )}

              {activeStep === 'preview' && (
                <div className="grid gap-5">
                  <div>
                    <h3 className="text-2xl text-foreground">Preview</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground-500">
                      Review how candidates will see this posting before you save or submit it.
                    </p>
                  </div>

                  <div className="rounded-xl border border-divider bg-content1 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-500">
                      <span className="rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-medium text-foreground-600">
                        Preview
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                        {form.expiresAt ? `Closes ${formatDate(form.expiresAt)}` : 'No closing date'}
                      </span>
                    </div>

                    <h4 className="mt-5 max-w-3xl text-3xl leading-[1.12] text-foreground sm:text-4xl">
                      {fallbackText(form.title, 'Untitled role')}
                    </h4>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground-500">
                      {fallbackText(form.shortDescription, 'No short description provided yet.')}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-divider bg-content2 px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-400">
                          <MapPin className="h-4 w-4" />
                          Location
                        </span>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {workLocationOptions.find((option) => option.key === logistics.workLocation)?.label ?? 'Not specified'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-divider bg-content2 px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-400">
                          <BriefcaseBusiness className="h-4 w-4" />
                          Employment
                        </span>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {employmentTypeOptions.find((option) => option.key === logistics.employmentType)?.label ?? 'Not specified'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-divider bg-content2 px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-400">
                          <WalletCards className="h-4 w-4" />
                          Salary
                        </span>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {fallbackText(logistics.salaryRange, 'Not specified')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-divider bg-content1 p-5 sm:p-6">
                    <h4 className="text-xl text-foreground">Description</h4>
                    <div className="job-description-markdown mt-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {fallbackText(form.description, 'No description provided yet.')}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="rounded-xl border border-divider bg-content1 p-5 sm:p-6">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h4 className="text-xl text-foreground">Required skills</h4>
                        <p className="mt-1 text-sm text-foreground-500">
                          Skills and minimum experience requested for this role.
                        </p>
                      </div>
                      <span className="text-sm text-foreground-500">{selectedSkills.length} listed</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {selectedSkills.length === 0 ? (
                        <div className="w-full rounded-lg border border-dashed border-divider bg-content2/50 px-4 py-3 text-sm text-foreground-500">
                          No skill requirements selected.
                        </div>
                      ) : (
                        selectedSkills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center rounded-[12px] border border-divider bg-content2 px-4 py-2 text-sm text-foreground"
                          >
                            <span className="font-medium">{skill.name}</span>
                            <span className="ml-2 text-foreground-500">
                              {skill.yearsOfExperience === null ? '· no YOE' : `· ${skill.yearsOfExperience} yrs`}
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'process' && (
                <InterviewActivityTemplateEditor
                  activities={interviewActivities}
                  onChange={setInterviewActivities}
                />
              )}

              <div className="flex flex-col gap-3 border-t border-divider pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    isDisabled={loading || isFirstStep}
                    onPress={goToPreviousStep}
                    className="rounded-lg"
                  >
                    Back
                  </Button>
                  {!isLastStep && (
                    <Button
                      type="button"
                      variant="secondary"
                      isDisabled={loading}
                      onPress={goToNextStep}
                      className="rounded-lg"
                    >
                      {activeStep === 'basic' && 'Next: required skills'}
                      {activeStep === 'skills' && 'Next: interview process'}
                      {activeStep === 'process' && 'Next: preview'}
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={loading}
                    className="rounded-lg"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <FilePlus2 className="h-4 w-4" />
                      Save draft
                    </span>
                  </Button>
                  {isLastStep && (
                    <Button
                      type="button"
                      variant="secondary"
                      isDisabled={loading}
                      onPress={() => void publishPosting()}
                      className="rounded-lg"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Send className="h-4 w-4" />
                        Publish for approval
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

      </form>
    </div>
  );
};
