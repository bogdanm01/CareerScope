import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";

import { EmptyChart } from "./EmptyChart";
import {
  formatChartDate,
  trendColor,
  trendFill,
} from "../../lib/analytics-utils";

export const TrendLineChart = ({ data }: { data: AnalyticsChartRecord[] }) => {
  if (data.length === 0) {
    return <EmptyChart label="No trend data available for this range." />;
  }

  const normalizedData = [...data]
    .sort(
      (left, right) =>
        new Date(`${left.date}`).getTime() -
        new Date(`${right.date}`).getTime(),
    )
    .reduce<AnalyticsChartRecord[]>((items, item) => {
      const previousTotal = Number(items.at(-1)?.applications ?? 0);
      const dailyApplications = Number(item.applications ?? 0);
      const applications =
        previousTotal +
        (Number.isFinite(dailyApplications) ? dailyApplications : 0);

      items.push({
        ...item,
        dailyApplications,
        applications,
        label: formatChartDate(item.date),
      });

      return items;
    }, []);
  const showPointMarkers = normalizedData.length <= 45;
  const axisTickGap = normalizedData.length > 180
    ? 64
    : normalizedData.length > 90
      ? 44
      : 28;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={normalizedData}
          margin={{ top: 10, right: 16, left: 12, bottom: 4 }}
        >
          <defs>
            <linearGradient
              id="applicationsTrendFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={trendFill} stopOpacity={0.34} />
              <stop offset="95%" stopColor={trendFill} stopOpacity={0.04} />
            </linearGradient>
          </defs>
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
            minTickGap={axisTickGap}
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
            cursor={{ stroke: trendColor, strokeOpacity: 0.18, strokeWidth: 2 }}
            labelFormatter={(_, payload) =>
              formatChartDate(payload?.[0]?.payload?.date)
            }
            isAnimationActive={false}
            formatter={(value, name, payload) => [
              value,
              name === "applications"
                ? `Applications (${payload?.payload?.dailyApplications ?? 0} new)`
                : "Applications",
            ]}
            contentStyle={{
              borderRadius: 12,
              borderColor: "hsl(var(--heroui-divider))",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Area
            type="monotone"
            dataKey="applications"
            stroke={trendColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#applicationsTrendFill)"
            activeDot={{
              r: 5,
              strokeWidth: 2.5,
              stroke: "#ffffff",
              fill: trendColor,
            }}
            dot={showPointMarkers
              ? { r: 3, strokeWidth: 2, stroke: trendColor, fill: "#ffffff" }
              : false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
