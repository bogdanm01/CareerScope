import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input, NumberField, toast } from '@heroui/react';
import { getMe, replaceCandidateSkills, updateMyProfile, uploadCandidateCv, uploadProfilePicture } from '../lib/me-api';
import { getApiBaseUrl } from '../lib/http';
import { useAtomValue, useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom, authSessionAtom } from '../store/auth';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import type { Skill } from '../lib/skills-api';

type SelectedSkill = {
  id: number;
  name: string;
  requiresYearsOfExperience: boolean;
  yearsOfExperience: number | null;
};

type ProfileSection = 'skills' | 'cv' | 'settings';

const SectionIcon = ({ name }: { name: 'skills' | 'cv' | 'settings' }) => {
  const paths = {
    skills: 'M12 3 4 7l8 4 8-4-8-4Zm-6 8 6 3 6-3M6 15l6 3 6-3',
    cv: 'M7 3h7l4 4v14H7z M14 3v5h5M9.5 12h5M9.5 15h5M9.5 18h3',
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
  const setAuthSession = useSetAtom(authSessionAtom);
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [, setSkillCatalogCount] = useState(0);
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
  const [activeSection, setActiveSection] = useState<ProfileSection>('skills');
  const [skillResetKey, setSkillResetKey] = useState(0);
  const selectedSkillIds = useMemo(() => selectedSkills.map((skill) => skill.id), [selectedSkills]);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCandidateProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
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
    toast.success('Skill added', {
      description: `${skill.name} was added to your profile draft.`,
    });
    setSelectedSkill(null);
    setSkillResetKey((current) => current + 1);
  };

  const updateQueuedSkillYears = (skillId: number, years: number) => {
    setSelectedSkills((current) =>
      current.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              yearsOfExperience: Number.isFinite(years) && years >= 0 ? years : 0,
            }
          : skill,
      ),
    );
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
            <Button type="button" variant="ghost" className={getSectionButtonClass('skills')} onPress={() => setActiveSection('skills')}>
              <SectionIcon name="skills" />
              <span className="text-sm leading-5">Skills</span>
            </Button>
            <Button type="button" variant="ghost" className={getSectionButtonClass('cv')} onPress={() => setActiveSection('cv')}>
              <SectionIcon name="cv" />
              <span className="text-sm leading-5">CV</span>
            </Button>
            <Button type="button" variant="ghost" className={getSectionButtonClass('settings')} onPress={() => setActiveSection('settings')}>
              <SectionIcon name="settings" />
              <span className="text-sm leading-5">Profile settings</span>
            </Button>
          </nav>
        </aside>

        <div className="grid gap-5">
          {activeSection === 'skills' && (
          <section>
            <form className="rounded-xl border border-divider bg-content1 p-5 sm:p-6" onSubmit={handleSkillsSubmit}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl text-foreground">Skills</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-500">
                      Filter by category, choose a skill, then attach your years of experience.
                    </p>
                  </div>
                  <div className="inline-flex w-fit rounded-full border border-[#9edec5] bg-[#e8f8f1] px-3 py-1.5 text-xs font-medium text-[#19734f]">
                    {selectedSkills.length} selected
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="grid content-start gap-4">
                    <SkillAutocomplete
                      label="Find a skill"
                      placeholder="Search and select a skill"
                      selectedSkill={selectedSkill}
                      resetKey={skillResetKey}
                      onSelect={setSelectedSkill}
                      onResultsChange={setSkillCatalogCount}
                      excludeIds={selectedSkillIds}
                    />

                    <div className="grid gap-3 border-t border-divider pt-4 sm:grid-cols-[minmax(140px,auto)_auto] sm:items-end">
                      {selectedSkill?.requiresYearsOfExperience === false ? (
                        <div className="rounded-lg bg-content2 px-3 py-2 text-sm text-foreground-500">
                          Years of experience is not required for this skill.
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
                        className="w-full bg-[#19734f] px-6 text-white hover:bg-[#145f42] sm:w-auto"
                        onPress={addSkill}
                      >
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
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedSkills.map((skill) => (
                            <div
                              key={skill.id}
                              className="grid gap-3 rounded-xl border border-divider bg-content2 p-3 text-sm text-foreground"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate font-medium">{skill.name}</div>
                                  <div className="mt-0.5 text-xs text-foreground-500">
                                    {skill.requiresYearsOfExperience ? 'Years of experience' : 'Experience not required'}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  isIconOnly
                                  aria-label={`Remove ${skill.name}`}
                                  variant="ghost"
                                  className="h-8 w-8 min-w-8 shrink-0 text-[#c24141]"
                                  onPress={() => removeQueuedSkill(skill.id)}
                                >
                                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                                    <path d="M4 7h16M10 11v6M14 11v6M9 7l.5-3h5L15 7m3 0-.7 13H6.7L6 7" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </Button>
                              </div>
                              {skill.requiresYearsOfExperience && (
                                <YearsOfExperienceField
                                  ariaLabel={`${skill.name} years of experience`}
                                  value={skill.yearsOfExperience ?? 0}
                                  onChange={(value) => updateQueuedSkillYears(skill.id, value)}
                                  className="max-w-36"
                                />
                              )}
                            </div>
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

          {activeSection === 'cv' && (
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
        </div>
      </section>
    </div>
  );
};
