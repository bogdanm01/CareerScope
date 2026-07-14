import { Button, Chip, Input, ListBox, Modal, Select, TextArea, toast, useOverlayState } from '@heroui/react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createJobApplicationActivity,
  deleteJobApplicationActivity,
  getJobApplicationActivities,
  getMyJobApplicationActivities,
  type JobApplicationActivity,
  type JobApplicationActivityPayload,
  type JobApplicationActivityStatus,
  updateJobApplicationActivity,
} from '../lib/job-applications-api';
import { formatDateTime } from '../lib/date-format';

type ApplicationInterviewTimelineProps = {
  applicationId: number;
  applicationStatus: string;
  mode: 'manage' | 'readonly';
};

type ActivityForm = {
  title: string;
  description: string;
  status: JobApplicationActivityStatus;
  scheduledAt: string;
  internalNote: string;
};

const statusOptions: JobApplicationActivityStatus[] = ['Pending', 'Scheduled', 'Completed', 'Skipped', 'Cancelled'];

const getStatusColor = (status: JobApplicationActivityStatus) => {
  if (status === 'Completed') return 'success';
  if (status === 'Scheduled') return 'warning';
  if (status === 'Skipped' || status === 'Cancelled') return 'danger';
  return 'default';
};

const toLocalInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toApiDate = (value: string) => (value ? new Date(value).toISOString() : null);

export const ApplicationInterviewTimeline = ({ applicationId, applicationStatus, mode }: ApplicationInterviewTimelineProps) => {
  const addActivityModal = useOverlayState();
  const [activities, setActivities] = useState<JobApplicationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [newForm, setNewForm] = useState<ActivityForm>({
    title: '',
    description: '',
    status: 'Pending',
    scheduledAt: '',
    internalNote: '',
  });
  const canManage = mode === 'manage' && applicationStatus === 'Interviewing';
  const isPreInterview = applicationStatus === 'Submitted' || applicationStatus === 'UnderReview';

  const loadActivities = async () => {
    setLoading(true);

    try {
      const response = mode === 'manage'
        ? await getJobApplicationActivities(applicationId)
        : await getMyJobApplicationActivities(applicationId);
      setActivities(response.data);
    } catch (error) {
      toast.danger('Unable to load interview timeline', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadActivities(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, mode]);

  const updateActivity = async (activity: JobApplicationActivity, payload: JobApplicationActivityPayload) => {
    setSavingId(activity.id);

    try {
      await updateJobApplicationActivity(activity.id, payload);
      toast.success('Interview activity updated');
      await loadActivities();
    } catch (error) {
      toast.danger('Unable to update activity', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  const createActivity = async () => {
    if (newForm.title.trim().length < 2) {
      toast.danger('Title required', { description: 'Add an activity title first.' });
      return;
    }

    setSavingId('new');

    try {
      await createJobApplicationActivity(applicationId, {
        title: newForm.title.trim(),
        description: newForm.description.trim() || null,
        status: newForm.status,
        scheduledAt: toApiDate(newForm.scheduledAt),
        internalNote: newForm.internalNote.trim() || null,
      });
      setNewForm({ title: '', description: '', status: 'Pending', scheduledAt: '', internalNote: '' });
      addActivityModal.close();
      toast.success('Interview activity added');
      await loadActivities();
    } catch (error) {
      toast.danger('Unable to add activity', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  const deleteActivity = async (activityId: number) => {
    setSavingId(activityId);

    try {
      await deleteJobApplicationActivity(activityId);
      toast.success('Interview activity deleted');
      await loadActivities();
    } catch (error) {
      toast.danger('Unable to delete activity', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-divider bg-content1 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl text-foreground">Interview timeline</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-500">
            {mode === 'manage'
              ? 'Manage the candidate-specific interview activities for this application.'
              : 'Track visible milestones for this application.'}
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg"
            onPress={() => {
              setNewForm({ title: '', description: '', status: 'Pending', scheduledAt: '', internalNote: '' });
              addActivityModal.open();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add activity
            </span>
          </Button>
        )}
      </div>

      {mode === 'manage' && !canManage && (
        <div className="mt-5 rounded-lg border border-divider bg-content2/50 p-4 text-sm leading-6 text-foreground-500">
          {applicationStatus === 'UnderReview'
            ? 'Start interviewing to schedule or update interview activities. This planned timeline is read-only during CV review.'
            : 'Interview activities can only be changed while the application is interviewing. This timeline is read-only.'}
        </div>
      )}

      {mode === 'readonly' && isPreInterview && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/10 p-4 text-sm leading-6 text-foreground-600">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-medium text-foreground">Interview process preview</p>
            <p className="mt-1">
              These stages are informational and are not active yet. If your CV and application pass the initial
              review, the recruiter will move your application to Interviewing and activate this timeline.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="rounded-lg border border-dashed border-divider bg-content2/50 p-4 text-sm text-foreground-500">
            Loading interview timeline...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-divider bg-content2/50 p-4 text-sm text-foreground-500">
            No interview activities yet.
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id} className="rounded-xl border border-divider bg-content2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-content1 text-xs font-semibold text-foreground">
                      {index + 1}
                    </span>
                    <h4 className="text-base font-semibold text-foreground">{activity.title}</h4>
                    <Chip className="rounded-md" color={getStatusColor(activity.status)} size="sm" variant="soft">
                      {activity.status}
                    </Chip>
                  </div>
                  {activity.description && (
                    <p className="mt-3 text-sm leading-6 text-foreground-500">{activity.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-500">
                    {activity.scheduledAt && <span>Scheduled {formatDateTime(activity.scheduledAt)}</span>}
                    {activity.completedAt && <span>Completed {formatDateTime(activity.completedAt)}</span>}
                  </div>
                  {mode === 'manage' && activity.internalNote && (
                    <p className="mt-3 rounded-lg bg-content1 px-3 py-2 text-sm text-foreground-500">
                      {activity.internalNote}
                    </p>
                  )}
                </div>

                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <Select
                      selectedKey={activity.status}
                      onSelectionChange={(key) => {
                        if (key) {
                          void updateActivity(activity, { status: String(key) as JobApplicationActivityStatus });
                        }
                      }}
                    >
                      <Select.Trigger className="h-9 min-w-[140px] rounded-lg text-sm">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox aria-label="Activity status">
                          {statusOptions.map((status) => (
                            <ListBox.Item key={status} id={status} textValue={status}>
                              {status}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Input
                      type="datetime-local"
                      className="w-[210px]"
                      value={toLocalInputValue(activity.scheduledAt)}
                      disabled={savingId === activity.id}
                      onChange={(event) => void updateActivity(activity, { scheduledAt: toApiDate(event.target.value) })}
                      aria-label="Scheduled date"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg"
                      isDisabled={savingId === activity.id}
                      onPress={() => void deleteActivity(activity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {canManage && (
        <Modal state={addActivityModal}>
          <Modal.Backdrop>
            <Modal.Container size="lg" placement="center" scroll="inside">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Add interview activity</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body>
                  <div className="grid gap-4">
                    <Input
                      value={newForm.title}
                      onChange={(event) => setNewForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Technical interview"
                      aria-label="New activity title"
                    />
                    <Input
                      type="datetime-local"
                      value={newForm.scheduledAt}
                      onChange={(event) => setNewForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                      aria-label="New activity scheduled date"
                    />
                    <TextArea
                      value={newForm.description}
                      onChange={(event) => setNewForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Candidate-visible description"
                    />
                    <TextArea
                      value={newForm.internalNote}
                      onChange={(event) => setNewForm((current) => ({ ...current, internalNote: event.target.value }))}
                      placeholder="Internal recruiter note"
                    />
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    isDisabled={savingId === 'new'}
                    onPress={addActivityModal.close}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="rounded-lg"
                    isDisabled={savingId === 'new'}
                    onPress={() => void createActivity()}
                  >
                    {savingId === 'new' ? 'Adding...' : 'Add activity'}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}
    </section>
  );
};
