import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300 backdrop-blur-xl sm:p-8">
        Loading application...
      </section>
    );
  }

  if (error && !detail) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            type="button"
            onClick={() => void loadDetail()}
          >
            Retry
          </button>
          <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white" to="/panel/applications">
            Back to applications
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
              Candidate
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Application detail</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Review the application, the target posting, and the profile data attached to your submission.
            </p>
          </div>

          <Link
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
            to="/panel/applications"
          >
            Back to applications
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Status</span>
            <strong className="mt-2 block text-sm font-medium text-white">{detail?.status || 'Unknown'}</strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Applied</span>
            <strong className="mt-2 block text-sm font-medium text-white">
              {detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : 'Unknown'}
            </strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <span className="block text-sm text-slate-400">Updated</span>
            <strong className="mt-2 block text-sm font-medium text-white">
              {detail?.updatedAt ? new Date(detail.updatedAt).toLocaleString() : 'Unknown'}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <h3 className="text-xl font-semibold text-white">Posting</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <div>
                <span className="block text-slate-500">Title</span>
                <span className="text-white">{detail?.jobPosting.title || 'Untitled role'}</span>
              </div>
              <div>
                <span className="block text-slate-500">Company</span>
                <span className="text-white">{detail?.jobPosting.company.name || 'Unknown company'}</span>
              </div>
              <div>
                <span className="block text-slate-500">Posting status</span>
                <span className="text-white">{detail?.jobPosting.status || 'Unknown'}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <h3 className="text-xl font-semibold text-white">Your profile snapshot</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <div>
                <span className="block text-slate-500">Name</span>
                <span className="text-white">{detail?.user.name}</span>
              </div>
              <div>
                <span className="block text-slate-500">Email</span>
                <span className="text-white">{detail?.user.email}</span>
              </div>
              <div>
                <span className="block text-slate-500">Skills</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(detail?.user.skills || []).length === 0 ? (
                    <span className="text-white">No skills listed.</span>
                  ) : (
                    detail?.user.skills?.map((skill) => (
                      <span key={skill.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {skill.name} · {skill.yearsOfExperience}y
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <h3 className="text-xl font-semibold text-white">Required skills</h3>
            <div className="mt-5 grid gap-3">
              {(detail?.jobPosting.skills || []).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                  No skill requirements listed.
                </div>
              ) : (
                detail?.jobPosting.skills?.map((skill) => (
                  <div key={skill.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{skill.name}</strong>
                      <span className="text-slate-400">
                        {skill.requiredYearsOfExperience === null ? 'Any experience' : `${skill.requiredYearsOfExperience}y required`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {error && detail && (
            <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-6 text-sm leading-6 text-rose-100 backdrop-blur-xl sm:p-8">
              {error}
            </section>
          )}
        </div>
      </section>
    </div>
  );
};
