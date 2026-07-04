import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { EmptyChart } from "./EmptyChart";
import { DailyApplicationsBarChart } from "./DailyApplicationsBarChart";
import { TrendLineChart } from "./TrendLineChart";

export const PostingTrendChart = ({
  data,
  type,
}: {
  data: AnalyticsChartRecord[];
  type: "trend" | "daily";
}) => {
  if (data.length < 2) {
    return (
      <EmptyChart label="Not enough data yet. This chart will populate after applications arrive on at least two different days." />
    );
  }

  return type === "trend" ? (
    <TrendLineChart data={data} />
  ) : (
    <DailyApplicationsBarChart data={data} />
  );
};
