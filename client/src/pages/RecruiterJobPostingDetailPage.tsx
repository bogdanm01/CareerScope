import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import {
  deleteJobPosting,
  getJobPostingDetail,
  updateJobPosting,
  type JobPostingDetail,
  type JobPostingUpdatePayload,
} from '../lib/job-postings-api';
import type { Skill } from '../lib/skills-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';
import { SkillAutocomplete } from '../components/SkillAutocomplete';

type SelectedSkill = {
  id: number;
  name: string;
  yearsOfExperience: number;
};

const statusOptions: Array<NonNullable<JobPostingUpdatePayload['status']>> = [
  'Draft',
  'PendingApproval',
  'Active',
  'Paused',
  'Closed',
];

export const RecruiterJobPostingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobPostingDetail | null>(null);
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<NonNullable<JobPostingUpdatePayload['status']>>('Draft');
  const [expiresAt, setExpiresAt] = useState('');
  const [skillCatalogCount, setSkillCatalogCount] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedYears, setSelectedYears] = useState('1');
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [skillResetKey, setSkillResetKey] = useState(0);

  const postingId = Number(id);

  const loadDetail = async () => {
    if (!Number.isFinite(postingId)) {
      setError('Invalid job posting id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getJobPostingDetail(postingId, ['skills', 'statusHistory', 'company']);
      const posting = response.data;
      setDetail(posting);
      setTitle(posting.title || '');
      setShortDescription(posting.shortDescription || '');
      setDescription(posting.description || '');
      setStatus((posting.status as NonNullable<JobPostingUpdatePayload['status']>) || 'Draft');
      setExpiresAt(posting.expiresAt ? posting.expiresAt.slice(0, 10) : '');
      setSelectedSkills(
        (posting.skills || []).map((skill) => ({
          id: skill.id,
          name: skill.name,
          yearsOfExperience: skill.yoe ?? 0,
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
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postingId]);

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
    setSkillMessage(`${skill.name} added to the posting.`);
    setSelectedSkill(null);
    setSkillResetKey((current) => current + 1);
  };

  const removeSkill = (skillId: number) => {
    setSelectedSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  const isSkillSelectionEqual = (left: SelectedSkill[], right: JobPostingDetail['skills']) => {
    const normalizedRight = (right || []).map((skill) => ({
      id: skill.id,
      name: skill.name,
      yearsOfExperience: skill.yoe ?? 0,
    }));

    if (left.length !== normalizedRight.length) {
      return false;
    }

    const rightById = new Map(normalizedRight.map((skill) => [skill.id, skill.yearsOfExperience]));
    return left.every((skill) => rightById.get(skill.id) === skill.yearsOfExperience);
  };

  const savePosting = async (nextStatus?: NonNullable<JobPostingUpdatePayload['status']>) => {
    if (!detail) {
      return;
    }

    setSaving(true);
    setSkillMessage(null);
    setActionMessage(null);
    setAuthError(null);
    setAuthLoading(true);

    const payload: JobPostingUpdatePayload = {
      skills: selectedSkills.map((skill) => ({
        skillId: skill.id,
        yoe: skill.yearsOfExperience,
      })),
    };

    const normalizedTitle = title.trim();
    const normalizedShortDescription = shortDescription.trim();
    const normalizedDescription = description.trim();

    if (normalizedTitle) {
      payload.title = normalizedTitle;
    }

    if (normalizedShortDescription) {
      payload.shortDescription = normalizedShortDescription;
    }

    if (normalizedDescription) {
      payload.description = normalizedDescription;
    }

    if (expiresAt) {
      payload.expiresAt = expiresAt;
    }

    const hasContentChanges =
      normalizedTitle !== (detail.title || '') ||
      normalizedShortDescription !== (detail.shortDescription || '') ||
      normalizedDescription !== (detail.description || '') ||
      expiresAt !== (detail.expiresAt ? detail.expiresAt.slice(0, 10) : '') ||
      !isSkillSelectionEqual(selectedSkills, detail.skills);

    const requestedStatus = nextStatus ?? status;

    if (!(detail.status === 'Active' && hasContentChanges && requestedStatus === detail.status)) {
      payload.status = requestedStatus;
    }

    try {
      const response = await updateJobPosting(detail.id, payload);
      setDetail(response.data);
      setTitle(response.data.title || '');
      setShortDescription(response.data.shortDescription || '');
      setDescription(response.data.description || '');
      setStatus((response.data.status as NonNullable<JobPostingUpdatePayload['status']>) || 'Draft');
      setExpiresAt(response.data.expiresAt ? response.data.expiresAt.slice(0, 10) : '');
      setSelectedSkills(
        (response.data.skills || []).map((skill) => ({
          id: skill.id,
          name: skill.name,
          yearsOfExperience: skill.yoe ?? 0,
        })),
      );
      setError(null);
      setActionMessage('Posting updated successfully.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to update job posting');
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

    const confirmed = window.confirm('Delete this job posting? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setActionMessage(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await deleteJobPosting(detail.id);
      navigate('/panel/job-postings', { replace: true });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete job posting');
    } finally {
      setSaving(false);
      setAuthLoading(false);
    }
  };

  const isBusy = loading || saving;

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300 backdrop-blur-xl sm:p-8">
        Loading job posting...
      </section>
    );
  }

  if (error && !detail) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            type="button"
            onClick={() => void loadDetail()}
          >
            Retry
          </button>
          <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white" to="/panel/job-postings">
            Back to postings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
              Recruiter
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{detail?.title || 'Untitled role'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Edit the posting details, status, and required skills.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
              to="/panel/job-postings"
            >
              Back to postings
            </Link>
            <button
              className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-500/20 disabled:cursor-progress disabled:opacity-70"
              type="button"
              onClick={() => void savePosting('PendingApproval')}
              disabled={isBusy}
            >
              Publish for approval
            </button>
            {detail?.status !== 'Active' && (
              <button
                className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-500/20 disabled:cursor-progress disabled:opacity-70"
                type="button"
                onClick={() => void handleDelete()}
                disabled={isBusy}
              >
                Delete
              </button>
            )}
            <button
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
              type="button"
              onClick={() => void loadDetail()}
              disabled={isBusy}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Company</span>
            <strong className="mt-2 block text-sm font-medium text-white">{detail?.company?.name || 'Unknown company'}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Status</span>
            <strong className="mt-2 block text-sm font-medium text-white">{detail?.status || 'Draft'}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Updated</span>
            <strong className="mt-2 block text-sm font-medium text-white">
              {detail?.updatedAt ? new Date(detail.updatedAt).toLocaleString() : 'Unknown'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold text-white">Edit posting</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Update the visible role details and the skill requirements that applicants need to match.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Title</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Short description</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                maxLength={80}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Description</span>
              <textarea
                className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Status</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as NonNullable<JobPostingUpdatePayload['status']>)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Expires at</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-3">
              <div className="text-sm text-slate-300">Required skills</div>
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
                    No required skills selected.
                  </div>
                ) : (
                  selectedSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200"
                    >
                      <span>
                        {skill.name} · {skill.yearsOfExperience} years
                      </span>
                      <button
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-white"
                        type="button"
                        onClick={() => removeSkill(skill.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {skillMessage && (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
                {skillMessage}
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-400">
              Skills loaded
              {' '}
              <span className="text-white">{skillCatalogCount}</span>
            </div>

            {actionMessage && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                {actionMessage}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                {error}
              </div>
            )}

            <button
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>

        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <h3 className="text-xl font-semibold text-white">Company details</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <div>
                <span className="block text-slate-500">Name</span>
                <span className="text-white">{detail?.company?.name || 'Unknown company'}</span>
              </div>
              <div>
                <span className="block text-slate-500">Website</span>
                <span className="text-white">{detail?.company?.websiteUrl || 'Not provided'}</span>
              </div>
              <div>
                <span className="block text-slate-500">Address</span>
                <span className="text-white">{detail?.company?.address || 'Not provided'}</span>
              </div>
              <div>
                <span className="block text-slate-500">Description</span>
                <span className="text-white">{detail?.company?.shortDescription || 'Not provided'}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <h3 className="text-xl font-semibold text-white">Status history</h3>
            <div className="mt-5 grid gap-3">
              {(detail?.statusHistory || []).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                  No status history available.
                </div>
              ) : (
                detail?.statusHistory?.map((entry) => (
                  <div key={entry.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{entry.status}</strong>
                      <span className="text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    {entry.reason && <p className="mt-2 leading-6 text-slate-300">{entry.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      {error && detail && (
        <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-6 text-sm leading-6 text-rose-100 backdrop-blur-xl sm:p-8">
          {error}
        </section>
      )}
    </div>
  );
};
