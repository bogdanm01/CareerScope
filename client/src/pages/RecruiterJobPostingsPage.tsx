import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Chip, Table } from '@heroui/react';
import { Plus } from 'lucide-react';
import { getRecruiterJobPostings, type JobPostingListItem } from '../lib/job-postings-api';
import { formatDate } from '../lib/date-format';

const getStatusColor = (status: string): 'accent' | 'danger' | 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'PendingApproval':
      return 'warning';
    case 'Rejected':
    case 'Expired':
      return 'danger';
    case 'Draft':
      return 'accent';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  if (status === 'PendingApproval') {
    return 'Pending Approval';
  }

  return status;
};

export const RecruiterJobPostingsPage = () => {
  const navigate = useNavigate();
  const [postings, setPostings] = useState<JobPostingListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadPostings = async () => {
    try {
      const response = await getRecruiterJobPostings();
      setPostings(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load job postings');
    }
  };

  useEffect(() => {
    void loadPostings();
  }, []);

  return (
    <div className="grid gap-8">
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl leading-[1.15] text-foreground">Your postings</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Manage drafts, approval requests, and active job postings from one place.
            </p>
          </div>
          <Button
            className="rounded-lg"
            type="button"
            variant="primary"
            onPress={() => navigate('/panel/job-postings/new')}
          >
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            <span>Add posting</span>
          </Button>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger-700">
            {error}
          </div>
        )}

        {postings.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500">
            No job postings yet. Create your first posting to start collecting applicants.
          </div>
        ) : (
          <Table className="mt-5" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Recruiter job postings">
                <Table.Header>
                  <Table.Column isRowHeader>Role</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Company</Table.Column>
                  <Table.Column>Expires</Table.Column>
                  <Table.Column>Created</Table.Column>
                  <Table.Column>Action</Table.Column>
                </Table.Header>
                <Table.Body>
                  {postings.map((posting) => (
                    <Table.Row key={posting.id} id={posting.id}>
                      <Table.Cell>
                        <div className="min-w-64">
                          <span className="block font-medium text-foreground">{posting.title || 'Untitled role'}</span>
                          <span className="mt-1 block line-clamp-2 text-sm text-foreground-500">
                            {posting.shortDescription || 'No description yet.'}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          className="rounded-md"
                          color={getStatusColor(posting.status)}
                          size="sm"
                          variant="soft"
                        >
                          {getStatusLabel(posting.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">{posting.company?.name || 'Unknown'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(posting.expiresAt, 'No expiry')}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-foreground-500">
                          {formatDate(posting.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-start">
                          <Link
                            className="whitespace-nowrap rounded-lg border border-divider bg-content1 px-3 py-2 text-sm font-medium text-foreground"
                            to={`/panel/job-postings/${posting.id}`}
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
