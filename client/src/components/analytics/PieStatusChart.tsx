import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { EmptyChart } from "./EmptyChart";
import { DonutTooltip } from "./DonutTooltip";
import { chartColors, statusLabel } from "../../lib/analytics-utils";

export const PieStatusChart = ({
  data,
  labelKey = "status",
}: {
  data: AnalyticsChartRecord[];
  labelKey?: string;
}) => {
  if (data.length === 0) {
    return <EmptyChart label="No breakdown data available yet." />;
  }

  const normalizedData: Array<AnalyticsChartRecord & { label: string }> =
    data.map((item) => ({
      ...item,
      label: statusLabel(item[labelKey]),
    }));
  const totalValue = normalizedData.reduce(
    (total, item) => total + Number(item.value ?? 0),
    0,
  );

  return (
    <div className="grid items-center gap-5 md:grid-cols-[minmax(172px,0.92fr)_minmax(0,1fr)]">
      <div className="relative mx-auto h-52 w-full max-w-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalizedData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="91%"
              paddingAngle={7}
              cornerRadius={12}
              stroke="transparent"
              strokeWidth={0}
            >
              {normalizedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={<DonutTooltip />}
              offset={12}
              isAnimationActive={false}
              wrapperStyle={{
                zIndex: 60,
                pointerEvents: "none",
              }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="grid justify-items-center">
            <strong className="text-2xl font-medium leading-none tracking-[-0.02em] text-foreground">
              {totalValue}
            </strong>
            <span className="mt-1 text-xs font-medium text-default-500">
              Total
            </span>
          </div>
        </div>
      </div>
      <div className="grid gap-2.5">
        {normalizedData.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-sm"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-default-600">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
              <span className="truncate font-medium">{item.label}</span>
            </span>
            <strong className="justify-self-end font-semibold tabular-nums text-foreground">
              {item.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};
