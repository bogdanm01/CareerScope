import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Candidate
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Profile details</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Add your skills and upload a CV to complete your candidate profile.
          </p>
        </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <span className="block text-sm text-slate-400">Onboarding</span>
              <strong className="mt-2 block text-sm font-medium text-white">{onboardingStatus}</strong>
            </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Selected skills</span>
            <strong className="mt-2 block text-sm font-medium text-white">{selectedSkills.length}</strong>
          </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <span className="block text-sm text-slate-400">Skills catalog</span>
            <strong className="mt-2 block text-sm font-medium text-white">{skillCatalogCount}</strong>
            </div>
          </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8" onSubmit={handleSkillsSubmit}>
          <h3 className="text-xl font-semibold text-white">Add skills</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
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
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                type="number"
                min="0"
                max="60"
                step="1"
                value={selectedYears}
                onChange={(event) => setSelectedYears(event.target.value)}
              />

              <button
                className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                type="button"
                onClick={addSkill}
              >
                Add
              </button>
            </div>

            <div className="grid gap-3">
              {selectedSkills.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                  No skills queued yet.
                </div>
              ) : (
                selectedSkills.map((skill) => (
                  <div key={skill.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                    {skill.name} · {skill.yearsOfExperience} years
                  </div>
                ))
              )}
            </div>

            {skillMessage && (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
                {skillMessage}
              </div>
            )}

            <button
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
              type="submit"
              disabled={selectedSkills.length === 0}
            >
              Save skills
            </button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <h3 className="text-xl font-semibold text-white">Upload CV</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Upload a single PDF file. The backend stores it as the candidate CV.
          </p>

          <div className="mt-5 grid gap-4">
            <input
              className="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
              type="file"
              accept="application/pdf"
              onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
            />

            <button
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
              type="button"
              onClick={() => void handleCvUpload()}
            >
              Upload CV
            </button>

            {cvMessage && (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
                {cvMessage}
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
};
