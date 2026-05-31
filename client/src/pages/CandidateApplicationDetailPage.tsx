import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Chip } from '@heroui/react';
import { getMyJobApplication, type JobApplicationDetail } from '../lib/job-applications-api';

export const CandidateApplicationDetailPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState<JobApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationId = Number(id);

  const loadDetail = async () => {
    if (!Number.isFinite(applicationId)) {
      setError('Invalid application id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getMyJobApplication(applicationId);
      setDetail(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load application');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [applicationId]);

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading application...
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
          <Link className="rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/applications">
            Back to applications
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
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Application detail</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review the application, the target posting, and the profile data attached to your submission.
            </p>
          </div>

          <Link
            className="rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-content2"
            to="/panel/applications"
          >
            Back to applications
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Status</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{detail?.status || 'Unknown'}</strong>
          </div>
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Applied</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">
              {detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : 'Unknown'}
            </strong>
          </div>
          <div className="rounded-3xl border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Updated</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">
              {detail?.updatedAt ? new Date(detail.updatedAt).toLocaleString() : 'Unknown'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-foreground">Posting</h3>
            <div className="mt-5 grid gap-3 text-sm text-foreground-500">
              <div>
                <span className="block text-foreground-500">Title</span>
                <span className="text-foreground">{detail?.jobPosting.title || 'Untitled role'}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Company</span>
                <span className="text-foreground">{detail?.jobPosting.company.name || 'Unknown company'}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Posting status</span>
                <span className="text-foreground">{detail?.jobPosting.status || 'Unknown'}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-foreground">Your profile snapshot</h3>
            <div className="mt-5 grid gap-3 text-sm text-foreground-500">
              <div>
                <span className="block text-foreground-500">Name</span>
                <span className="text-foreground">{detail?.user.name}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Email</span>
                <span className="text-foreground">{detail?.user.email}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Skills</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(detail?.user.skills || []).length === 0 ? (
                    <span className="text-foreground">No skills listed.</span>
                  ) : (
                    detail?.user.skills?.map((skill) => (
                      <Chip key={skill.id} size="sm" variant="secondary">
                        {skill.name} · {skill.yearsOfExperience}y
                      </Chip>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-foreground">Required skills</h3>
            <div className="mt-5 grid gap-3">
              {(detail?.jobPosting.skills || []).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                  No skill requirements listed.
                </div>
              ) : (
                detail?.jobPosting.skills?.map((skill) => (
                  <div key={skill.id} className="rounded-3xl border border-divider bg-content2 p-4 text-sm text-foreground">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{skill.name}</strong>
                      <span className="text-foreground-500">
                        {skill.requiredYearsOfExperience === null ? 'Any experience' : `${skill.requiredYearsOfExperience}y required`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {error && detail && (
        <section className="rounded-[2rem] border border-danger/20 bg-danger/10 p-6 text-sm leading-6 text-danger-700 sm:p-8">
          {error}
        </section>
      )}
        </div>
      </section>
    </div>
  );
};
