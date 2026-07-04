import { Chip } from "@heroui/react";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import {
  rankBadgeColors,
  neutralRankBadgeColor,
  statusLabel,
} from "../../lib/analytics-utils";
import { EmptyChart } from "./EmptyChart";

export const TopList = ({
  data,
  labelKey,
  columns = false,
}: {
  data: AnalyticsChartRecord[];
  labelKey: string;
  columns?: boolean;
}) => {
  if (data.length === 0) {
    return <EmptyChart label="No ranked data available yet." />;
  }

  const orderedData = columns
    ? data
        .map((_, index) => {
          const midpoint = Math.ceil(data.length / 2);
          const sourceIndex =
            index % 2 === 0 ? index / 2 : midpoint + Math.floor(index / 2);

          return data[sourceIndex];
        })
        .filter(Boolean)
    : data;

  return (
    <div className={columns ? "grid gap-2 lg:grid-cols-2" : "grid gap-2"}>
      {orderedData.map((item, index) => {
        const originalIndex = data.indexOf(item);
        const rankColor =
          rankBadgeColors[originalIndex] ?? neutralRankBadgeColor;

        return (
          <div
            key={`${item[labelKey]}-${index}`}
            className="flex min-h-11 items-center justify-between gap-4 rounded-lg border border-divider bg-content2/40 px-3 py-2"
          >
            <div className="inline-flex min-w-0 items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{
                  backgroundColor: rankColor.background,
                  color: rankColor.text,
                }}
              >
                #{originalIndex + 1}
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {statusLabel(item[labelKey])}
              </span>
            </div>
            <Chip className="rounded-md" size="sm" variant="secondary">
              {item.value ?? item.applications ?? 0}
            </Chip>
          </div>
        );
      })}
    </div>
  );
};
