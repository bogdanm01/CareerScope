import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ListBox, Select } from '@heroui/react';
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
    <div className="grid gap-8">
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-md bg-[#a8d8c4] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#181d26]">
            Recruiter
          </div>
          <h2 className="mt-4 text-4xl leading-[1.15] text-foreground">Review job applications</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Choose one of your postings to load its applications and review applicants.
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm text-foreground-600">Job posting</span>
          <Select
            selectedKey={Number.isFinite(selectedPostingId) ? String(selectedPostingId) : null}
            onSelectionChange={(key) => {
              const value = key ? String(key) : '';
              setSearchParams(value ? { postingId: value } : {});
            }}
            fullWidth
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox aria-label="Job postings">
                {postings.map((posting) => (
                  <ListBox.Item key={posting.id} id={String(posting.id)} textValue={posting.title || `Posting ${posting.id}`}>
                    {posting.title || `Posting ${posting.id}`}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </label>

        {selectedPosting && (
          <div className="mt-5 rounded-lg border border-divider bg-content1 p-4 text-sm text-foreground-500">
            <span className="block text-foreground-500">Selected posting</span>
            <strong className="block text-foreground">{selectedPosting.title || 'Untitled role'}</strong>
            <span>{selectedPosting.company?.name || 'Unknown company'}</span>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-2xl text-foreground">Applications</h3>

        {loading ? (
          <div className="mt-5 rounded-xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            {selectedPostingId ? 'No applications found for this posting.' : 'Select a posting to view applications.'}
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="rounded-xl border border-divider bg-content1 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">{application.user.fullName}</h4>
                    <p className="mt-1 text-sm text-foreground-500">{application.user.email}</p>
                  </div>
                  <span className="rounded-md border border-divider bg-content2 px-3 py-1 text-xs font-medium text-foreground">
                    {application.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-foreground-500 sm:grid-cols-2">
                  <div>
                    <span className="block text-foreground-500">Applied</span>
                    <span className="text-foreground">{new Date(application.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-foreground-500">Application ID</span>
                    <span className="text-foreground">#{application.id}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <Link
                      className="inline-flex rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground"
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
