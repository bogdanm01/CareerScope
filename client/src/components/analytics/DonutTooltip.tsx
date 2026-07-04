type DonutTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: {
      label?: string;
      value?: number;
    };
  }>;
};

export const DonutTooltip = ({ active, payload }: DonutTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const label = item.payload?.label ?? item.name ?? "Item";
  const value = item.payload?.value ?? item.value ?? 0;

  return (
    <div className="rounded-lg border border-divider bg-content1 px-3 py-2 shadow-lg">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-default-600">{label}</span>
        <strong className="font-semibold tabular-nums text-foreground">
          {value}
        </strong>
      </div>
    </div>
  );
};
