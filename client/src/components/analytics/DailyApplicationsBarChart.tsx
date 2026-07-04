import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { formatChartDate, trendColor } from "../../lib/analytics-utils";
import { EmptyChart } from "./EmptyChart";

export const DailyApplicationsBarChart = ({
  data,
}: {
  data: AnalyticsChartRecord[];
}) => {
  if (data.length === 0) {
    return (
      <EmptyChart label="No daily application data available for this range." />
    );
  }

  const normalizedData = [...data]
    .sort(
      (left, right) =>
        new Date(`${left.date}`).getTime() -
        new Date(`${right.date}`).getTime(),
    )
    .map((item) => ({
      ...item,
      applications: Number(item.applications ?? 0),
      label: formatChartDate(item.date),
    }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={normalizedData}
          margin={{ top: 10, right: 12, left: -8, bottom: 6 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="currentColor"
            className="text-default-200"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={20}
            className="text-xs text-default-400"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            className="text-xs text-default-400"
          />
          <Tooltip
            cursor={{ fill: "rgba(184, 74, 27, 0.08)" }}
            labelFormatter={(_, payload) =>
              formatChartDate(payload?.[0]?.payload?.date)
            }
            isAnimationActive={false}
            formatter={(value) => [value, "Applications"]}
            contentStyle={{
              borderRadius: 12,
              borderColor: "hsl(var(--heroui-divider))",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Bar dataKey="applications" fill={trendColor} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
