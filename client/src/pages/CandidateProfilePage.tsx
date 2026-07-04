import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Dropdown, Input, NumberField, toast } from '@heroui/react';
import { ChevronDown, Plus, X } from 'lucide-react';
import {
  getMe,
  getMyCompany,
  replaceCandidateSkills,
  submitCompanyChangeRequest,
  updateMyProfile,
  uploadCandidateCv,
  uploadProfilePicture,
  type RecruiterCompanyProfile,
} from '../lib/me-api';
import { getApiBaseUrl } from '../lib/http';
import { useAtomValue, useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom, authSessionAtom } from '../store/auth';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import { getSkillCategories, type Skill, type SkillCategory } from '../lib/skills-api';

type SelectedSkill = {
  id: number;
  name: string;
  requiresYearsOfExperience: boolean;
  yearsOfExperience: number | null;
};

type ProfileSection = 'skills' | 'cv' | 'settings' | 'company';

const SectionIcon = ({ name }: { name: ProfileSection }) => {
  const paths = {
    skills: 'M12 3 4 7l8 4 8-4-8-4Zm-6 8 6 3 6-3M6 15l6 3 6-3',
    cv: 'M7 3h7l4 4v14H7z M14 3v5h5M9.5 12h5M9.5 15h5M9.5 18h3',
    company: 'M6 20V7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5V20m-5 0v-4h-2v4M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01',
    settings:
      'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm7.4-2.2a7.9 7.9 0 0 0 0-2.6l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-2.2-1.3L14.5 3h-5l-.3 2.4A7.4 7.4 0 0 0 7 6.7l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 0 2.6l-2 1.5 2 3.5 2.4-1a7.4 7.4 0 0 0 2.2 1.3l.3 2.4h5l.3-2.4a7.4 7.4 0 0 0 2.2-1.3l2.4 1 2-3.5-2-1.5Z',
  } as const;

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[1.8]">
      <path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const YearsOfExperienceField = ({
  ariaLabel,
  value,
  onChange,
  className = '',
}: {
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) => (
  <NumberField
    aria-label={ariaLabel}
    fullWidth
    minValue={0}
    maxValue={60}
    step={1}
    value={value}
    onChange={(nextValue) => {
      onChange(Number.isFinite(nextValue) ? nextValue : 0);
    }}
    className={className}
  >
    <NumberField.Group>
      <NumberField.DecrementButton />
      <NumberField.Input />
      <NumberField.IncrementButton />
    </NumberField.Group>
  </NumberField>
);

export const CandidateProfilePage = () => {
  const session = useAtomValue(authSessionAtom);
  const role = session?.user.role;
  const isCandidate = role === 'Candidate';
  const isRecruiter = role === 'Recruiter';
  const setAuthSession = useSetAtom(authSessionAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [skillCatalogCount, setSkillCatalogCount] = useState(0);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedYears, setSelectedYears] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [profileFirstName, setProfileFirstName] = useState(session?.user.firstName ?? '');
  const [profileLastName, setProfileLastName] = useState(session?.user.lastName ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(session?.user.image ?? null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ProfileSection>(isCandidate ? 'skills' : 'settings');
  const [skillResetKey, setSkillResetKey] = useState(0);
  const [companyProfile, setCompanyProfile] = useState<RecruiterCompanyProfile | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    taxId: '',
    shortDescription: '',
    description: '',
    foundingYear: '',
    numberOfEmployees: '',
    address: '',
    logoUrl: '',
    websiteUrl: '',
  });
  const selectedSkillIds = useMemo(() => selectedSkills.map((skill) => skill.id), [selectedSkills]);
  const activeSkillCategory = skillCategories.find((category) => category.id === selectedCategoryId);
  const visibleSkillCategories = skillCategories.slice(0, 6);
  const hiddenSkillCategoryCount = Math.max(skillCategories.length - visibleSkillCategories.length, 0);
  const hiddenSkillCategories = skillCategories.slice(visibleSkillCategories.length);
  const filteredHiddenSkillCategories = hiddenSkillCategories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );
  const cvDownloadUrl = useMemo(() => {
    if (!cvUrl) {
      return null;
    }

    const baseUrl = getApiBaseUrl();
    return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}/api/me/cv` : new URL('/api/me/cv', baseUrl).toString();
  }, [cvUrl]);
  const displayName = session?.user.name || [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'Candidate';
  const displayedProfileImageUrl = useMemo(() => {
    const imageUrl = profileImagePreviewUrl ?? profileImageUrl;

    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
      return imageUrl;
    }

    const baseUrl = getApiBaseUrl();
    return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${imageUrl}` : new URL(imageUrl, baseUrl).toString();
  }, [profileImagePreviewUrl, profileImageUrl]);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const syncSessionProfile = (profile: { name: string; firstName: string; lastName: string; image: string | null }) => {
    setAuthSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        user: {
          ...currentSession.user,
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          image: profile.image,
        },
      };
    });
  };

  const loadCandidateProfile = async () => {
    try {
      const response = await getMe();
      setCvUrl(response.data.cvUrl);
      setProfileFirstName(response.data.firstName);
      setProfileLastName(response.data.lastName);
      setProfileImageUrl(response.data.image);
      syncSessionProfile({
        name: response.data.name,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        image: response.data.image,
      });
      setSelectedSkills(
        response.data.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          requiresYearsOfExperience: skill.requiresYearsOfExperience,
          yearsOfExperience: skill.yearsOfExperience,
        })),
      );
    } catch {
      setCvUrl(null);
      setSelectedSkills([]);
    }
  };

  const syncCompanyForm = (company: RecruiterCompanyProfile) => {
    const source = company.pendingChangeRequest ?? company;
    setCompanyForm({
      name: source.name ?? '',
      taxId: source.taxId ?? '',
      shortDescription: source.shortDescription ?? '',
      description: source.description ?? '',
      foundingYear: source.foundingYear == null ? '' : String(source.foundingYear),
      numberOfEmployees: source.numberOfEmployees == null ? '' : String(source.numberOfEmployees),
      address: source.address ?? '',
      logoUrl: source.logoUrl ?? '',
      websiteUrl: source.websiteUrl ?? '',
    });
  };

  const loadRecruiterCompany = async () => {
    if (!isRecruiter) {
      return;
    }

    try {
      const response = await getMyCompany();
      setCompanyProfile(response.data);
      syncCompanyForm(response.data);
    } catch {
      setCompanyProfile(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCandidateProfile();
      void loadRecruiterCompany();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSkillCategories = async () => {
      try {
        if (!isCandidate) {
          return;
        }

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
  }, [isCandidate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!isCandidate && (activeSection === 'skills' || activeSection === 'cv')) {
        setActiveSection('settings');
      }

      if (!isRecruiter && activeSection === 'company') {
        setActiveSection('settings');
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeSection, isCandidate, isRecruiter]);

  useEffect(() => {
    if (!profileImageFile) {
      const timeoutId = window.setTimeout(() => setProfileImagePreviewUrl(null), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    const timeoutId = window.setTimeout(() => setProfileImagePreviewUrl(objectUrl), 0);

    return () => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileImageFile]);

  const addSkill = () => {
    const skill = selectedSkill;

    if (!skill) {
      toast.danger('Skill required', {
        description: 'Select a skill first.',
      });
      return;
    }

    const years = skill.requiresYearsOfExperience ? selectedYears : null;
    if (skill.requiresYearsOfExperience && (!Number.isFinite(selectedYears) || selectedYears < 0)) {
      toast.danger('Invalid experience', {
        description: 'Years of experience must be zero or greater.',
      });
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
          requiresYearsOfExperience: skill.requiresYearsOfExperience,
          yearsOfExperience: years,
        },
      ];
    });
    setSelectedSkill(null);
    setSkillResetKey((current) => current + 1);
  };

  const removeQueuedSkill = (skillId: number) => {
    setSelectedSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  const handleSkillsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      await replaceCandidateSkills({
        skills: selectedSkills.map((skill) => ({
          id: skill.id,
          yearsOfExperience: skill.requiresYearsOfExperience ? skill.yearsOfExperience : null,
        })),
      });
      toast.success('Skills updated', {
        description: 'Your profile skills were saved successfully.',
      });
      await loadCandidateProfile();
    } catch (error) {
      toast.danger('Unable to update skills', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCvUpload = async () => {
    if (!cvFile) {
      toast.danger('CV required', {
        description: 'Choose a PDF file first.',
      });
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    try {
      const response = await uploadCandidateCv(cvFile);
      toast.success('CV uploaded', {
        description: `Uploaded ${response.data.fileName}.`,
      });
      setCvFile(null);
      setCvUrl(response.data.cvUrl);
      setAuthSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        return {
          ...currentSession,
          user: {
            ...currentSession.user,
            onboardingStatus: response.data.onboardingStatus as typeof currentSession.user.onboardingStatus,
          },
        };
      });
    } catch (error) {
      toast.danger('Unable to upload CV', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const profileResponse = await updateMyProfile({
        firstName: profileFirstName,
        lastName: profileLastName,
      });

      syncSessionProfile(profileResponse.data);
      setProfileFirstName(profileResponse.data.firstName);
      setProfileLastName(profileResponse.data.lastName);
      setProfileImageUrl(profileResponse.data.image);

      if (profileImageFile) {
        const pictureResponse = await uploadProfilePicture(profileImageFile);

        syncSessionProfile(pictureResponse.data);
        setProfileImageUrl(pictureResponse.data.image);
        setProfileImageFile(null);
      }

      toast.success('Profile updated', {
        description: profileImageFile ? 'Your name and profile picture were saved successfully.' : 'Your name was saved successfully.',
      });
    } catch (error) {
      toast.danger('Unable to update profile', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompanySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const foundingYear = companyForm.foundingYear.trim() ? Number(companyForm.foundingYear) : null;
    const numberOfEmployees = companyForm.numberOfEmployees.trim() ? Number(companyForm.numberOfEmployees) : null;

    if ((foundingYear !== null && !Number.isInteger(foundingYear)) || (numberOfEmployees !== null && !Number.isInteger(numberOfEmployees))) {
      toast.danger('Invalid company details', {
        description: 'Founding year and employees must be whole numbers when provided.',
      });
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    try {
      await submitCompanyChangeRequest({
        name: companyForm.name.trim(),
        taxId: companyForm.taxId.trim(),
        shortDescription: companyForm.shortDescription.trim() || null,
        description: companyForm.description.trim() || null,
        foundingYear,
        numberOfEmployees,
        address: companyForm.address.trim(),
        logoUrl: companyForm.logoUrl.trim() || null,
        websiteUrl: companyForm.websiteUrl.trim() || null,
      });
      toast.success('Company update submitted', {
        description: 'An admin will review the proposed company profile changes.',
      });
      await loadRecruiterCompany();
    } catch (error) {
      toast.danger('Unable to submit company update', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const getSectionButtonClass = (section: ProfileSection) =>
    [
      'w-full justify-start gap-2.5 px-3 py-2',
      activeSection === section ? 'bg-content2 text-foreground' : 'text-foreground-500 hover:bg-content2 hover:text-foreground',
    ].join(' ');

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-xl border border-divider bg-content1 p-2 lg:sticky lg:top-6">
          <nav aria-label="Profile sections" className="grid gap-1">
            {isCandidate && (
              <>
                <Button type="button" variant="ghost" className={getSectionButtonClass('skills')} onPress={() => setActiveSection('skills')}>
                  <SectionIcon name="skills" />
                  <span className="text-sm leading-5">Skills</span>
                </Button>
                <Button type="button" variant="ghost" className={getSectionButtonClass('cv')} onPress={() => setActiveSection('cv')}>
                  <SectionIcon name="cv" />
                  <span className="text-sm leading-5">CV</span>
                </Button>
              </>
            )}
            <Button type="button" variant="ghost" className={getSectionButtonClass('settings')} onPress={() => setActiveSection('settings')}>
              <SectionIcon name="settings" />
              <span className="text-sm leading-5">Profile settings</span>
            </Button>
            {isRecruiter && (
              <Button type="button" variant="ghost" className={getSectionButtonClass('company')} onPress={() => setActiveSection('company')}>
                <SectionIcon name="company" />
                <span className="text-sm leading-5">Company details</span>
              </Button>
            )}
          </nav>
        </aside>

        <div className="grid gap-5">
          {isCandidate && activeSection === 'skills' && (
          <section>
            <form className="rounded-xl border border-divider bg-content1 p-5 sm:p-6" onSubmit={handleSkillsSubmit}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl text-foreground">Skills</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-500">
                      Add the skills you want recruiters to see on your profile.
                    </p>
                  </div>
                  <div className="inline-flex w-fit rounded-full border border-[#9edec5] bg-[#e8f8f1] px-3 py-1.5 text-xs font-medium text-[#19734f]">
                    {skillCatalogCount} available
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="grid content-start gap-4">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-foreground-600">Filter by category</span>
                        <span className="text-sm text-foreground-500">{activeSkillCategory?.name ?? 'All skills'}</span>
                      </div>
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

                    <div className="grid gap-3 border-t border-divider pt-4 lg:grid-cols-[minmax(0,1fr)_160px_auto] lg:items-end">
                      <SkillAutocomplete
                        label="Skill"
                        placeholder={`Search skills in "${activeSkillCategory?.name ?? 'All'}"...`}
                        selectedSkill={selectedSkill}
                        resetKey={skillResetKey}
                        categoryId={selectedCategoryId}
                        categoryName={activeSkillCategory?.name ?? null}
                        showCategoryFilter={false}
                        onSelect={setSelectedSkill}
                        onResultsChange={setSkillCatalogCount}
                        excludeIds={selectedSkillIds}
                      />

                      {selectedSkill?.requiresYearsOfExperience === false ? (
                        <div className="grid gap-2">
                          <span className="text-sm font-medium text-foreground-700">Years</span>
                          <div className="flex h-10 items-center rounded-lg bg-content2 px-3 text-sm text-foreground-500">
                            Not required
                          </div>
                        </div>
                      ) : (
                        <label className="grid gap-2 text-sm font-medium text-foreground-700">
                          <span>Years</span>
                          <YearsOfExperienceField
                            ariaLabel="Years of experience"
                            value={selectedYears}
                            onChange={setSelectedYears}
                          />
                        </label>
                      )}

                      <Button
                        type="button"
                        variant="primary"
                        className="h-10 w-full rounded-lg bg-[#19734f] px-6 text-white hover:bg-[#145f42] lg:w-auto"
                        onPress={addSkill}
                      >
                        <Plus className="h-4 w-4" />
                        Add skill
                      </Button>
                    </div>
                  </div>

                  <div className="grid content-start gap-4 border-t border-divider pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-medium text-foreground">Selected skills</h4>
                        <p className="mt-1 text-xs text-foreground-500">Edit years or remove skills before saving.</p>
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        className="rounded-lg"
                        isDisabled={selectedSkills.length === 0}
                      >
                        Save
                      </Button>
                    </div>

                    <div>
                      {selectedSkills.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-divider bg-content2 p-5 text-sm text-foreground-500">
                          No skills selected yet.
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
                                  {skill.requiresYearsOfExperience
                                    ? ` · ${skill.yearsOfExperience ?? 0} yrs`
                                    : ' · no YOE'}
                                </span>
                              </span>
                              <button
                                type="button"
                                className="grid h-5 w-5 shrink-0 cursor-pointer place-items-center text-foreground-400 transition-colors hover:text-foreground"
                                aria-label={`Remove ${skill.name}`}
                                onClick={() => removeQueuedSkill(skill.id)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </section>
          )}

          {isCandidate && activeSection === 'cv' && (
          <section>
            <div className="rounded-xl border border-divider bg-content1 p-5 sm:p-6">
              <h3 className="text-2xl text-foreground">Resume</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-500">
                Manage the PDF resume attached to your candidate profile.
              </p>

              <div className="mt-5 grid max-w-xl gap-4">
                {cvUrl && (
                  <div className="flex flex-col gap-3 rounded-xl border border-[#9edec5] bg-[#e8f8f1] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#19734f]">CV uploaded</div>
                      <div className="mt-1 text-xs text-[#19734f]/80">Upload a new PDF only if you want to replace it.</div>
                    </div>
                    {cvDownloadUrl && (
                      <a
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#9edec5] bg-white px-3 text-sm font-medium text-[#19734f]"
                        href={cvDownloadUrl}
                      >
                        Download CV
                      </a>
                    )}
                  </div>
                )}

                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
                />

                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-fit"
                  onPress={() => void handleCvUpload()}
                >
                  {cvUrl ? 'Replace CV' : 'Upload CV'}
                </Button>

              </div>
            </div>
          </section>
          )}

          {activeSection === 'settings' && (
          <section>
            <div className="rounded-xl border border-divider bg-content1 p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5e9d4] text-lg font-semibold text-[#181d26]">
                  {displayedProfileImageUrl ? (
                    <img src={displayedProfileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials || displayName[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl text-foreground">Profile settings</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground-500">
                    Update your public name and profile picture.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <form className="grid max-w-2xl gap-6" onSubmit={handleProfileSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-foreground-700">
                      <span>First name</span>
                      <Input
                        value={profileFirstName}
                        onChange={(event) => setProfileFirstName(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground-700">
                      <span>Last name</span>
                      <Input
                        value={profileLastName}
                        onChange={(event) => setProfileLastName(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-divider bg-content2 p-4">
                    <span className="block text-sm text-foreground-500">Email</span>
                    <strong className="mt-2 block truncate text-sm font-medium text-foreground">{session?.user.email}</strong>
                    <span className="mt-1 block text-xs text-foreground-500">Email changes are not supported yet.</span>
                  </div>

                  <div className="grid gap-4 border-t border-divider pt-5">
                    <div>
                      <h4 className="text-base font-medium text-foreground">Profile picture</h4>
                      <p className="mt-1 text-xs leading-5 text-foreground-500">
                        Upload a JPG, PNG, or WebP image up to 2 MB.
                      </p>
                    </div>

                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full sm:w-fit">
                    Save profile
                  </Button>
                </form>
              </div>
            </div>
          </section>
          )}

          {isRecruiter && activeSection === 'company' && (
          <section>
            <div className="rounded-xl border border-divider bg-content1 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl text-foreground">Company details</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-500">
                    Submit profile changes for admin review. Your current approved public company page remains live until approval.
                  </p>
                </div>
                {companyProfile?.approvalStatus && (
                  <span className="inline-flex w-fit rounded-md border border-divider bg-content2 px-3 py-1 text-xs font-medium text-foreground-600">
                    {companyProfile.pendingChangeRequest ? 'Profile update pending' : companyProfile.approvalStatus}
                  </span>
                )}
              </div>

              {companyProfile?.pendingChangeRequest && (
                <div className="mt-5 rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm leading-6 text-warning-700">
                  A proposed company update is waiting for admin approval. The form below shows the pending values.
                </div>
              )}

              {companyProfile?.approvalRejectionReason && !companyProfile.pendingChangeRequest && (
                <div className="mt-5 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">
                  <strong className="block">Latest rejection reason</strong>
                  <span>{companyProfile.approvalRejectionReason}</span>
                </div>
              )}

              <form className="mt-6 grid max-w-4xl gap-5" onSubmit={handleCompanySubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground-700">
                    <span>Company name</span>
                    <Input
                      value={companyForm.name}
                      onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground-700">
                    <span>Tax ID</span>
                    <Input
                      value={companyForm.taxId}
                      onChange={(event) => setCompanyForm((current) => ({ ...current, taxId: event.target.value }))}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground-700">
                    <span>Website URL</span>
                    <Input
                      value={companyForm.websiteUrl}
                      onChange={(event) => setCompanyForm((current) => ({ ...current, websiteUrl: event.target.value }))}
                      placeholder="https://example.com"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground-700">
                    <span>Logo URL</span>
                    <Input
                      value={companyForm.logoUrl}
                      onChange={(event) => setCompanyForm((current) => ({ ...current, logoUrl: event.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground-700">
                    <span>Founded year</span>
                    <Input
                      type="number"
                      value={companyForm.foundingYear}
                      onChange={(event) => setCompanyForm((current) => ({ ...current, foundingYear: event.target.value }))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground-700">
                    <span>Employees</span>
                    <Input
                      type="number"
                      value={companyForm.numberOfEmployees}
                      onChange={(event) => setCompanyForm((current) => ({ ...current, numberOfEmployees: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-medium text-foreground-700">
                  <span>Address</span>
                  <Input
                    value={companyForm.address}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, address: event.target.value }))}
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground-700">
                  <span>Short description</span>
                  <Input
                    value={companyForm.shortDescription}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, shortDescription: event.target.value }))}
                    maxLength={160}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground-700">
                  <span>Description</span>
                  <textarea
                    className="min-h-40 rounded-lg border border-divider bg-content1 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-foreground/30"
                    value={companyForm.description}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>

                <Button type="submit" variant="primary" className="w-full sm:w-fit">
                  Submit for review
                </Button>
              </form>
            </div>
          </section>
          )}
        </div>
      </section>
    </div>
  );
};
