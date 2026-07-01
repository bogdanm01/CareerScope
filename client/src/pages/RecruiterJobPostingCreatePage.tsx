import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Calendar, Card, DateField, DatePicker, Dropdown, Input, ListBox, Select } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { ArrowLeft, ChevronDown, FilePlus2, Plus, Send, X } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { RichTextEditor } from '../components/RichTextEditor';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import {
  createJobPosting,
  type JobPostingCreatePayload,
  type JobPostingEmploymentType,
  type JobPostingWorkLocation,
} from '../lib/job-postings-api';
import { getSkillCategories, type Skill, type SkillCategory } from '../lib/skills-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';

type RecruiterJobPostingCreatePageProps = {
  loading: boolean;
};

type SelectedSkill = {
  id: number;
  name: string;
  yearsOfExperience: number;
};

type CreateStep = 'basic' | 'skills' | 'activities' | 'preview';

type PostingLogisticsDraft = {
  workLocation: JobPostingWorkLocation | '';
  employmentType: JobPostingEmploymentType | '';
  salaryRange: string;
};

const steps: Array<{ key: CreateStep; label: string }> = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'skills', label: 'Required Skills' },
  { key: 'activities', label: 'Activities' },
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
  const [error, setError] = useState<string | null>(null);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [skillCatalogCount, setSkillCatalogCount] = useState(0);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedYears, setSelectedYears] = useState('1');
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
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

    const years = Number(selectedYears);
    if (!Number.isFinite(years) || years < 0) {
      setSkillMessage('Years of experience must be zero or greater.');
      return;
    }

    setSelectedSkills((current) => {
      if (current.some((entry) => entry.id === skill.id)) {
        return current;
      }

      return [...current, { id: skill.id, name: skill.name, yearsOfExperience: years }];
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
        yoe: skill.yearsOfExperience,
      })),
    };

    const response = await createJobPosting(payload);
    navigate(`/panel/job-postings/${response.data.id}`);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await submitPosting('Draft');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create job posting');
    } finally {
      setAuthLoading(false);
    }
  };

  const publishPosting = async () => {
    setError(null);
    setAuthError(null);

    if (selectedSkills.length === 0) {
      setActiveStep('skills');
      setSkillMessage('Add at least one required skill before publishing for approval.');
      return;
    }

    setAuthLoading(true);

    try {
      await submitPosting('PendingApproval');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to publish job posting');
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
                              ? 'border-[#181d26] bg-[#181d26] text-white'
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
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Title <span className="text-danger">*</span></span>
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
                  <span className="text-sm font-medium text-foreground">Expires at</span>
                  <PostingDatePicker
                    value={form.expiresAt ?? ''}
                    onChange={(value) => updateField('expiresAt', value)}
                  />
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Short description</span>
                <Input
                  value={form.shortDescription ?? ''}
                  onChange={(event) => updateField('shortDescription', event.target.value)}
                  placeholder="One or two sentences for the postings list"
                  maxLength={120}
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <RichTextEditor
                  value={form.description ?? ''}
                  onChange={(value) => updateField('description', value)}
                  placeholder="Add responsibilities, requirements, benefits, and hiring process details..."
                />
              </div>
                </>
              )}

              {activeStep === 'skills' && (
              <div className="grid gap-5">
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

                <div className="grid gap-3">
                  <span className="text-sm font-medium text-foreground-600">Filter by category</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={[
                        'cursor-pointer rounded-[4px] border px-3 py-1.5 !text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
                        selectedCategoryId === null
                          ? 'border-[#181d26] bg-[#181d26] text-white'
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
                            ? 'border-[#181d26] bg-[#181d26] text-white'
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
                                        ? 'border-[#181d26] bg-[#181d26] text-white'
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
                          className="inline-flex max-w-full items-center gap-3 rounded-[12px] bg-content1 px-4 py-2 text-[14px] text-foreground shadow-sm"
                        >
                          <span className="truncate">
                            <span className="font-medium">{skill.name}</span>
                            <span className="font-medium text-foreground-500"> · {skill.yearsOfExperience} yrs</span>
                          </span>
                          <button
                            type="button"
                            className="grid h-5 w-5 shrink-0 place-items-center text-foreground-400 transition-colors hover:text-foreground"
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

              {activeStep === 'activities' && (
                <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-divider bg-content2/40 p-6 text-sm text-foreground-500">
                  Activities will be added here.
                </div>
              )}

              {activeStep === 'preview' && (
                <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-divider bg-content2/40 p-6 text-sm text-foreground-500">
                  Preview will be added here.
                </div>
              )}

              {(error || loading) && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
                  {error || 'Saving posting...'}
                </div>
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
                      {activeStep === 'skills' && 'Next: activities'}
                      {activeStep === 'activities' && 'Next: preview'}
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
