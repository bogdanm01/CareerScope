import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { statusLabel, chartColors } from "../../lib/analytics-utils";
import { EmptyChart } from "./EmptyChart";

export const CategoryBarChart = ({
  data,
  labelKey,
  emptyLabel,
  valueLabel,
}: {
  data: AnalyticsChartRecord[];
  labelKey: string;
  emptyLabel: string;
  valueLabel: string;
}) => {
  if (data.length === 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  const normalizedData = data.map((item) => ({
    ...item,
    label: statusLabel(item[labelKey]),
    value: Number(item.value ?? 0),
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
            interval={0}
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
            isAnimationActive={false}
            formatter={(value) => [value, valueLabel]}
            contentStyle={{
              borderRadius: 12,
              borderColor: "hsl(var(--heroui-divider))",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {normalizedData.map((_, index) => (
              <Cell
                key={`category-bar-${index}`}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
