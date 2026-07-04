import { Button, Input, TextArea } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import type { InterviewActivityTemplatePayload } from '../lib/job-postings-api';

type InterviewActivityTemplateEditorProps = {
  activities: InterviewActivityTemplatePayload[];
  onChange: (activities: InterviewActivityTemplatePayload[]) => void;
};

const emptyActivity = (orderIndex: number): InterviewActivityTemplatePayload => ({
  title: '',
  description: '',
  orderIndex,
  isRequired: true,
});

export const InterviewActivityTemplateEditor = ({
  activities,
  onChange,
}: InterviewActivityTemplateEditorProps) => {
  const normalizedActivities = activities.map((activity, index) => ({ ...activity, orderIndex: index }));

  const updateActivity = (index: number, updates: Partial<InterviewActivityTemplatePayload>) => {
    onChange(
      normalizedActivities.map((activity, activityIndex) =>
        activityIndex === index ? { ...activity, ...updates } : activity,
      ),
    );
  };

  const removeActivity = (index: number) => {
    onChange(normalizedActivities.filter((_, activityIndex) => activityIndex !== index));
  };

  const moveActivity = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= normalizedActivities.length) {
      return;
    }

    const nextActivities = [...normalizedActivities];
    const [activity] = nextActivities.splice(index, 1);
    nextActivities.splice(nextIndex, 0, activity);
    onChange(nextActivities.map((item, itemIndex) => ({ ...item, orderIndex: itemIndex })));
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl text-foreground">Interview process</h3>
          <p className="mt-1 text-sm leading-6 text-foreground-500">
            Define the default activities copied to every new application for this posting.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="rounded-lg"
          onPress={() => onChange([...normalizedActivities, emptyActivity(normalizedActivities.length)])}
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add activity
          </span>
        </Button>
      </div>

      {normalizedActivities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-divider bg-content2/50 px-4 py-4 text-sm text-foreground-500">
          No interview activities defined yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {normalizedActivities.map((activity, index) => (
            <div key={index} className="rounded-xl border border-divider bg-content1 p-4">
              <div className="grid gap-3 lg:grid-cols-[40px_minmax(0,1fr)_auto] lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-content2 text-sm font-semibold text-foreground">
                  {index + 1}
                </div>
                <div className="grid gap-3">
                  <Input
                    value={activity.title}
                    onChange={(event) => updateActivity(index, { title: event.target.value })}
                    placeholder="HR call"
                    aria-label={`Activity ${index + 1} title`}
                  />
                  <TextArea
                    value={activity.description ?? ''}
                    onChange={(event) => updateActivity(index, { description: event.target.value })}
                    placeholder="Optional details for recruiters and candidates."
                    aria-label={`Activity ${index + 1} description`}
                  />
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground-600">
                    <input
                      type="checkbox"
                      checked={activity.isRequired ?? true}
                      onChange={(event) => updateActivity(index, { isRequired: event.target.checked })}
                    />
                    Required step
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    isDisabled={index === 0}
                    onPress={() => moveActivity(index, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    isDisabled={index === normalizedActivities.length - 1}
                    onPress={() => moveActivity(index, 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="rounded-lg"
                    onPress={() => removeActivity(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
