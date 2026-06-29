import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Chip, Input, TextArea, toast } from '@heroui/react';
import { createApplicationReview, getMyJobApplication, type JobApplicationDetail } from '../lib/job-applications-api';
import { formatDateTime } from '../lib/date-format';

const formatStatus = (status?: string) => {
  if (!status) {
    return 'Unknown';
  }

  return status === 'UnderReview' ? 'Under Review' : status;
};

export const CandidateApplicationDetailPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState<JobApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

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

  const handleReviewSubmit = async () => {
    const numericRating = Number(rating);
    const trimmedComment = comment.trim();

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      toast.danger('Invalid rating', {
        description: 'Rating must be a number from 1 to 5.',
      });
      return;
    }

    if (trimmedComment.length < 3) {
      toast.danger('Comment required', {
        description: 'Add a short comment before submitting your review.',
      });
      return;
    }

    setReviewing(true);

    try {
      await createApplicationReview(applicationId, {
        rating: numericRating,
        comment: trimmedComment,
      });
      toast.success('Company review submitted', {
        description: 'Thanks for sharing feedback about this company.',
      });
      setComment('');
      setRating('5');
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : 'Unable to submit company review.';
      const isDuplicate = /already|duplicate|conflict/i.test(message);
      toast.danger(isDuplicate ? 'Review already submitted' : 'Unable to submit review', {
        description: isDuplicate ? 'This application has already been reviewed.' : message,
      });
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 text-sm text-foreground-500 sm:p-8">
        Loading application...
      </section>
    );
  }

  if (error && !detail) {
    return (
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="rounded-3xl border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger-700">{error}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onPress={() => void loadDetail()}>
            Retry
          </Button>
          <Link className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground" to="/panel/applications">
            Back to applications
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-md bg-[#f5e9d4] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#181d26]">
              Candidate
            </div>
            <h2 className="mt-4 text-4xl leading-[1.15] text-foreground">Application detail</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
              Review the application, the target posting, and the profile data attached to your submission.
            </p>
          </div>

          <Link
            className="rounded-lg border border-divider bg-content1 px-4 py-2 text-sm font-medium text-foreground"
            to="/panel/applications"
          >
            Back to applications
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Status</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">{formatStatus(detail?.status)}</strong>
          </div>
          <div className="rounded-lg border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Applied</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">
              {formatDateTime(detail?.createdAt)}
            </strong>
          </div>
          <div className="rounded-lg border border-divider bg-content2 p-4">
            <span className="block text-sm text-foreground-500">Updated</span>
            <strong className="mt-2 block text-sm font-medium text-foreground">
              {formatDateTime(detail?.updatedAt)}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-8">
          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-2xl text-foreground">Posting</h3>
            <div className="mt-5 grid gap-3 text-sm text-foreground-500">
              <div>
                <span className="block text-foreground-500">Title</span>
                <span className="text-foreground">{detail?.jobPosting.title || 'Untitled role'}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Company</span>
                {detail?.jobPosting.company.id ? (
                  <Link className="text-foreground underline-offset-4 hover:underline" to={`/companies/${detail.jobPosting.company.id}`}>
                    {detail.jobPosting.company.name || 'Unknown company'}
                  </Link>
                ) : (
                  <span className="text-foreground">{detail?.jobPosting.company.name || 'Unknown company'}</span>
                )}
              </div>
              <div>
                <span className="block text-foreground-500">Posting status</span>
                <span className="text-foreground">{detail?.jobPosting.status || 'Unknown'}</span>
              </div>
              <div>
                <span className="block text-foreground-500">Description</span>
                <p className="mt-2 whitespace-pre-line text-foreground">
                  {detail?.jobPosting.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-2xl text-foreground">Your profile snapshot</h3>
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
                      <Chip key={skill.id} className="rounded-md" size="sm" variant="secondary">
                        {skill.name} · {skill.yearsOfExperience === null ? 'No YOE required' : `${skill.yearsOfExperience}y`}
                      </Chip>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-8">
          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-2xl text-foreground">Required skills</h3>
            <div className="mt-5 grid gap-3">
              {(detail?.jobPosting.skills || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-divider bg-content2 p-4 text-sm text-foreground-500">
                  No skill requirements listed.
                </div>
              ) : (
                detail?.jobPosting.skills?.map((skill) => (
                  <div key={skill.id} className="rounded-lg border border-divider bg-content2 p-4 text-sm text-foreground">
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

          <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
            <h3 className="text-2xl text-foreground">Review company</h3>
            <p className="mt-2 text-sm leading-6 text-foreground-500">
              Share public feedback about {detail?.jobPosting.company.name || 'this company'} based on this application.
            </p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Rating
                <Input
                  max={5}
                  min={1}
                  type="number"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Comment
                <TextArea
                  minLength={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What should other candidates know?"
                />
              </label>
              <Button
                className="w-fit rounded-lg"
                type="button"
                variant="primary"
                isDisabled={reviewing}
                onPress={() => void handleReviewSubmit()}
              >
                {reviewing ? 'Submitting...' : 'Submit review'}
              </Button>
            </div>
          </section>

          {error && detail && (
        <section className="rounded-3xl border border-danger/20 bg-danger/10 p-6 text-sm leading-6 text-danger-700 sm:p-8">
          {error}
        </section>
      )}
        </div>
      </section>
    </div>
  );
};
