import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Chip, Table } from '@heroui/react';
import { getMyJobApplications, type CandidateJobApplicationListItem } from '../lib/job-applications-api';
import { formatDate } from '../lib/date-format';

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

const getStatusLabel = (status: string) => (status === 'UnderReview' ? 'Under Review' : status);

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
    <div className="grid gap-8">
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl leading-[1.15] text-foreground">My applications</h2>
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
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <h3 className="text-2xl text-foreground">Application history</h3>

        {loading ? (
          <div className="mt-5 rounded-xl border border-divider bg-content2 p-6 text-sm text-foreground-500">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No applications found yet.
          </div>
        ) : (
          <Table className="mt-5" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Application history">
                <Table.Header>
                  <Table.Column isRowHeader>Role</Table.Column>
                  <Table.Column>Company</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Applied</Table.Column>
                  <Table.Column>Expires</Table.Column>
                  <Table.Column>Action</Table.Column>
                </Table.Header>
                <Table.Body>
                  {applications.map((application) => (
                    <Table.Row key={application.id} id={application.id}>
                      <Table.Cell>
                        <span className="font-medium text-foreground">
                          {application.jobPosting.title || 'Untitled role'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-foreground-500">{application.jobPosting.company.name}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="rounded-md"
                          color={getStatusColor(application.status)}
                          size="sm"
                          variant="soft"
                        >
                          {getStatusLabel(application.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(application.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {application.jobPosting.expiresAt
                            ? formatDate(application.jobPosting.expiresAt)
                            : 'No expiry'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-start">
                          <Link
                            className="whitespace-nowrap rounded-lg border border-divider bg-content1 px-3 py-2 text-sm font-medium text-foreground"
                            to={`/panel/applications/${application.id}`}
                          >
                            View details
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
