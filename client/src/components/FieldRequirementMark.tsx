type FieldRequirementMarkProps = {
  level: 'draft' | 'approval';
};

const requirementCopy = {
  draft: 'Required for drafts and approval',
  approval: 'Required only when submitting for approval',
} as const;

export const FieldRequirementMark = ({ level }: FieldRequirementMarkProps) => (
  <span
    className={level === 'draft' ? 'font-semibold text-danger' : 'font-semibold text-warning-600'}
    aria-label={requirementCopy[level]}
    title={requirementCopy[level]}
  >
    *
  </span>
);

export const FieldRequirementLegend = () => (
  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs leading-5 text-foreground-500">
    <span className="inline-flex items-center gap-1.5">
      <FieldRequirementMark level="draft" />
      Required for drafts and approval
    </span>
    <span className="inline-flex items-center gap-1.5">
      <FieldRequirementMark level="approval" />
      Required only for approval
    </span>
  </div>
);
