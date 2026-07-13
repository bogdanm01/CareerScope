import type { AnalyticsStat } from "../../lib/analytics-api";
import { getStatValue } from "../../lib/analytics-utils";
import { EmptyChart } from "./EmptyChart";

export const ApplicationFunnel = ({ stats }: { stats: AnalyticsStat[] }) => {
  const total = getStatValue(stats, "applications");
  const rows = [
    {
      label: "Under review",
      value: getStatValue(stats, "underReview"),
      color: "var(--status-warning)",
    },
    {
      label: "Accepted",
      value: getStatValue(stats, "accepted"),
      color: "var(--chart-positive)",
    },
    {
      label: "Rejected",
      value: getStatValue(stats, "rejected"),
      color: "var(--chart-negative)",
    },
  ];
  const maxValue = Math.max(1, total, ...rows.map((row) => row.value));

  if (total === 0) {
    return (
      <EmptyChart label="No applications for this posting in the selected range." />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        {rows.map((row) => {
          const width = `${Math.max(4, (row.value / maxValue) * 100)}%`;

          return (
            <div key={row.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-default-600">
                  {row.label}
                </span>
                <strong className="font-semibold tabular-nums text-foreground">
                  {row.value}
                </strong>
              </div>
              <div className="h-3 rounded-full bg-content2">
                <div
                  className="h-full rounded-full"
                  style={{ width, backgroundColor: row.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
