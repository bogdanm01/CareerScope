import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Chip, ListBox, Select, Table } from '@heroui/react';
import { getRecruiterJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { getRecruiterJobApplications, type RecruiterJobApplicationListItem } from '../lib/job-applications-api';
import { formatDateTime } from '../lib/date-format';

const formatStatus = (status: string) => (status === 'UnderReview' ? 'Under Review' : status);

const getStatusColor = (status: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'UnderReview':
      return 'warning';
    case 'Submitted':
      return 'accent';
    default:
      return 'default';
  }
};

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
          <h2 className="text-4xl leading-[1.15] text-foreground">Review job applications</h2>
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
          <Table className="mt-5" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Job applications">
                <Table.Header>
                  <Table.Column isRowHeader>Application ID</Table.Column>
                  <Table.Column>Applicant</Table.Column>
                  <Table.Column>Email</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Applied</Table.Column>
                  <Table.Column>Action</Table.Column>
                </Table.Header>
                <Table.Body>
                  {applications.map((application) => (
                    <Table.Row key={application.id} id={application.id}>
                      <Table.Cell>
                        <span className="whitespace-nowrap font-medium text-foreground">#{application.id}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap font-medium text-foreground">
                          {application.user.fullName}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="block max-w-72 truncate text-foreground-500" title={application.user.email}>
                          {application.user.email}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="rounded-md"
                          color={getStatusColor(application.status)}
                          size="sm"
                          variant="soft"
                        >
                          {formatStatus(application.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDateTime(application.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-start">
                          <Link
                            className="whitespace-nowrap rounded-lg border border-divider bg-content1 px-3 py-2 text-sm font-medium text-foreground"
                            to={`/panel/job-applications/${application.id}`}
                          >
                            Open detail
                          </Link>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </section>
    </div>
  );
};
