import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input } from '@heroui/react';
import { getOnboardingStatus, replaceCandidateSkills, uploadCandidateCv } from '../lib/me-api';
import { useSetAtom } from 'jotai';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { SkillAutocomplete } from '../components/SkillAutocomplete';
import type { Skill } from '../lib/skills-api';

type SelectedSkill = {
  id: number;
  name: string;
  yearsOfExperience: number;
};

export const CandidateProfilePage = () => {
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [onboardingStatus, setOnboardingStatus] = useState<string>('Profile created');
  const [skillCatalogCount, setSkillCatalogCount] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedYears, setSelectedYears] = useState('1');
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvMessage, setCvMessage] = useState<string | null>(null);
  const [skillResetKey, setSkillResetKey] = useState(0);

  const loadOnboardingStatus = async () => {
    try {
      const response = await getOnboardingStatus();
      setOnboardingStatus(response.data.onboardingStatus);
    } catch {
      setOnboardingStatus('Profile created');
    }
  };

  useEffect(() => {
    void loadOnboardingStatus();
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
    setSkillMessage(`${skill.name} added to the submission list.`);
    setSelectedSkill(null);
    setSkillResetKey((current) => current + 1);
  };

  const handleSkillsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSkillMessage(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await replaceCandidateSkills({
        skills: selectedSkills.map((skill) => ({
          id: skill.id,
          yearsOfExperience: skill.yearsOfExperience,
        })),
      });
      setSkillMessage('Skills updated successfully.');
      await loadOnboardingStatus();
    } catch (error) {
      setSkillMessage(error instanceof Error ? error.message : 'Unable to update skills');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCvUpload = async () => {
    if (!cvFile) {
      setCvMessage('Choose a PDF file first.');
      return;
    }

    setCvMessage(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      const response = await uploadCandidateCv(cvFile);
      setCvMessage(`Uploaded ${response.data.fileName}.`);
      await loadOnboardingStatus();
    } catch (error) {
      setCvMessage(error instanceof Error ? error.message : 'Unable to upload CV');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground-600">
            Candidate
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Profile details</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Add your skills and upload a CV to complete your candidate profile.
          </p>
        </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-divider bg-content2 p-4">
              <span className="block text-sm text-foreground-500">Onboarding</span>
              <strong className="mt-2 block text-sm font-medium text-foreground">{onboardingStatus}</strong>
            </div>
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Selected skills</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{selectedSkills.length}</strong>
          </div>
            <div className="rounded-3xl border border-divider bg-content2 p-4">
              <span className="block text-sm text-foreground-500">Skills catalog</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{skillCatalogCount}</strong>
            </div>
          </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8" onSubmit={handleSkillsSubmit}>
          <h3 className="text-xl font-semibold text-foreground">Add skills</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-500">
            Search the catalog, add each skill with years of experience, then submit the list to the backend.
          </p>

          <div className="mt-5 grid gap-4">
            <SkillAutocomplete
              label="Skill"
              placeholder="Search and select a skill"
              selectedSkill={selectedSkill}
              resetKey={skillResetKey}
              onSelect={setSelectedSkill}
              onResultsChange={setSkillCatalogCount}
              excludeIds={selectedSkills.map((skill) => skill.id)}
            />

            <div className="grid gap-3 sm:grid-cols-[120px_auto]">
              <Input
                type="number"
                min="0"
                max="60"
                step="1"
                value={selectedYears}
                onChange={(event) => setSelectedYears(event.target.value)}
              />

              <Button
                type="button"
                variant="secondary"
                onPress={addSkill}
              >
                Add
              </Button>
            </div>

            <div className="grid gap-3">
              {selectedSkills.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                  No skills queued yet.
                </div>
              ) : (
                selectedSkills.map((skill) => (
                  <div key={skill.id} className="rounded-3xl border border-divider bg-content2 p-4 text-sm text-foreground">
                    {skill.name} · {skill.yearsOfExperience} years
                  </div>
                ))
              )}
            </div>

            {skillMessage && (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
                {skillMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isDisabled={selectedSkills.length === 0}
            >
              Save skills
            </Button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-foreground">Upload CV</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-500">
            Upload a single PDF file. The backend stores it as the candidate CV.
          </p>

          <div className="mt-5 grid gap-4">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
            />

            <Button
              type="button"
              variant="primary"
              onPress={() => void handleCvUpload()}
            >
              Upload CV
            </Button>

            {cvMessage && (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-700">
                {cvMessage}
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
};
