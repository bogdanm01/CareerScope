import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Chip } from '@heroui/react';
import { getMyJobApplications, type CandidateJobApplicationListItem } from '../lib/job-applications-api';

export const CandidateApplicationsPage = () => {
  const [applications, setApplications] = useState<CandidateJobApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyJobApplications();
      setApplications(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-divider bg-content2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground-600">
              Candidate
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">My applications</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Track every submission and open the full application record when you need more detail.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            onPress={() => void loadApplications()}
            isDisabled={loading}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-foreground">Application history</h3>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No applications found yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="rounded-3xl border border-divider bg-content2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{application.jobPosting.title || 'Untitled role'}</h4>
                    <p className="mt-1 text-sm text-foreground-500">{application.jobPosting.company.name}</p>
                  </div>
                  <Chip size="sm" variant="secondary">{application.status}</Chip>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-foreground-500 sm:grid-cols-3">
                  <div>
                    <span className="block text-foreground-500">Applied</span>
                    <span className="text-foreground">{new Date(application.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Expires</span>
                    <span className="text-foreground">
                      {application.jobPosting.expiresAt ? new Date(application.jobPosting.expiresAt).toLocaleDateString() : 'No expiry'}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <Link
                      className="rounded-2xl border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-content2"
                      to={`/panel/applications/${application.id}`}
                    >
                      View detail
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
