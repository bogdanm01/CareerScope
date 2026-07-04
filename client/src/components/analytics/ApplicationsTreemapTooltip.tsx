type ApplicationsTreemapTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: {
      name?: string;
      value?: number;
    };
  }>;
};

export const ApplicationsTreemapTooltip = ({
  active,
  payload,
}: ApplicationsTreemapTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const companyName = item.payload?.name ?? item.name ?? "Company";
  const applications = item.payload?.value ?? item.value ?? 0;

  return (
    <div className="rounded-xl border border-divider bg-content1 px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{companyName}</p>
      <p className="mt-1 text-sm text-default-500">
        {applications} applications
      </p>
    </div>
  );
};
