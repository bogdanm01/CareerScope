import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { Button } from '@heroui/react';
import { getJobPostingDetail, type JobPostingDetail } from '../lib/job-postings-api';
import { applyToJobPosting } from '../lib/job-applications-api';
import { authErrorAtom, authLoadingAtom } from '../store/auth';

export const CandidateJobDetailPage = () => {
  const { id } = useParams();
  const setAuthError = useSetAtom(authErrorAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const [detail, setDetail] = useState<JobPostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const jobPostingId = Number(id);

  const loadDetail = async () => {
    if (!Number.isFinite(jobPostingId)) {
      setError('Invalid job posting id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getJobPostingDetail(jobPostingId, ['skills', 'company', 'statusHistory']);
      setDetail(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job posting');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [jobPostingId]);

  const handleApply = async () => {
    if (!detail) {
      return;
    }

    setApplying(true);
    setMessage(null);
    setError(null);
    setAuthError(null);
    setAuthLoading(true);

    try {
      await applyToJobPosting(detail.id);
      setMessage('Application submitted successfully.');
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'Unable to apply for this job');
    } finally {
      setApplying(false);
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading job posting...
      </section>
    );
  }

  if (error && !detail) {
    return (
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-3xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onPress={() => void loadDetail()}>
            Retry
          </Button>
          <Link className="rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/jobs">
            Back to jobs
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground-600">
              Candidate
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{detail?.title || 'Untitled role'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review the role requirements before you apply.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-content2"
              to="/panel/jobs"
            >
              Back to jobs
            </Link>
            <Button
              type="button"
              variant="primary"
              isDisabled={applying}
              onPress={() => void handleApply()}
            >
              {applying ? 'Applying...' : 'Apply now'}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Company</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{detail?.company?.name || 'Unknown company'}</strong>
          </div>
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Status</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{detail?.status || 'Unknown'}</strong>
          </div>
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Expires</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">
              {detail?.expiresAt ? new Date(detail.expiresAt).toLocaleDateString() : 'No expiry'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-foreground">Description</h3>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground-500">
            {detail?.description || 'No description provided.'}
          </p>
        </section>

        <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-foreground">Required skills</h3>
          <div className="mt-5 grid gap-3">
            {(detail?.skills || []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                No skill requirements listed.
              </div>
            ) : (
              detail?.skills?.map((skill) => (
                <div key={skill.id} className="rounded-3xl border border-divider bg-content2 p-4 text-sm text-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{skill.name}</strong>
                    <span className="text-foreground-500">
                      {skill.yoe === null || skill.yoe === undefined ? 'Any experience' : `${skill.yoe}y required`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      {message && (
        <section className="rounded-[2rem] border border-success/20 bg-success/10 p-6 text-sm leading-6 text-success-700 sm:p-8">
          {message}
        </section>
      )}

      {error && detail && (
        <section className="rounded-[2rem] border border-danger/20 bg-danger/10 p-6 text-sm leading-6 text-danger-700 sm:p-8">
          {error}
        </section>
      )}
    </div>
  );
};
