import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRecruiterJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { getRecruiterJobApplications, type RecruiterJobApplicationListItem } from '../lib/job-applications-api';

export const RecruiterApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [applications, setApplications] = useState<RecruiterJobApplicationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedPostingId = Number(searchParams.get('postingId') || '');
  const selectedPosting = postings.find((posting) => posting.id === selectedPostingId);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await getRecruiterJobPostings();
        if (isMounted) {
          setPostings(response.data);
        }
      } catch {
        if (isMounted) {
          setPostings([]);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      if (!selectedPostingId) {
        setApplications([]);
        return;
      }

      setLoading(true);

      try {
        const response = await getRecruiterJobApplications(selectedPostingId);
        if (isMounted) {
          setApplications(response.data);
        }
      } catch {
        if (isMounted) {
          setApplications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadApplications();

    return () => {
      isMounted = false;
    };
  }, [selectedPostingId]);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Recruiter
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Review job applications</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Choose one of your postings to load its applications and review applicants.
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Job posting</span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/15"
            value={Number.isFinite(selectedPostingId) ? String(selectedPostingId) : ''}
            onChange={(event) => {
              const value = event.target.value;
              setSearchParams(value ? { postingId: value } : {});
            }}
          >
            <option value="">Select a posting</option>
            {postings.map((posting) => (
              <option key={posting.id} value={posting.id}>
                {posting.title || `Posting ${posting.id}`}
              </option>
            ))}
          </select>
        </label>

        {selectedPosting && (
          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <span className="block text-slate-500">Selected posting</span>
            <strong className="block text-white">{selectedPosting.title || 'Untitled role'}</strong>
            <span>{selectedPosting.company?.name || 'Unknown company'}</span>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <h3 className="text-xl font-semibold text-white">Applications</h3>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            {selectedPostingId ? 'No applications found for this posting.' : 'Select a posting to view applications.'}
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{application.user.fullName}</h4>
                    <p className="mt-1 text-sm text-slate-300">{application.user.email}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    {application.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <span className="block text-slate-500">Applied</span>
                    <span className="text-white">{new Date(application.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Application ID</span>
                    <span className="text-white">#{application.id}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <Link
                      className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-sky-500/10"
                      to={`/panel/job-applications/${application.id}`}
                    >
                      Open detail
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
