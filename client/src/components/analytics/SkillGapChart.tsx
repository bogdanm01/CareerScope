import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { EmptyChart } from "./EmptyChart";
import { SkillBalanceLabel } from "./SkillBalanceLabel";
import { SkillBalanceTooltip } from "./SkillBalanceTooltip";
import { formatSignedNumber, statusLabel } from "../../lib/analytics-utils";

export const SkillGapChart = ({ data }: { data: AnalyticsChartRecord[] }) => {
  if (data.length === 0) {
    return <EmptyChart label="No skill gap data available yet." />;
  }

  const normalizedData = data
    .map((item) => {
      const demand = Number(item.demand ?? 0);
      const supply = Number(item.supply ?? 0);
      const supplyBalance = supply - demand;

      return {
        ...item,
        skill: statusLabel(item.skill),
        demand,
        supply,
        supplyBalance,
      };
    })
    .sort(
      (left, right) =>
        Math.abs(right.supplyBalance) - Math.abs(left.supplyBalance),
    )
    .slice(0, 7);
  const maxAbsValue = Math.max(
    1,
    ...normalizedData.map((item) => Math.abs(item.supplyBalance)),
  );
  const domainPadding = Math.ceil(maxAbsValue * 1.18);

  return (
    <div className="grid gap-4">
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={normalizedData}
            layout="vertical"
            margin={{ top: 10, right: 42, left: 8, bottom: 18 }}
            barCategoryGap={24}
          >
            <CartesianGrid stroke="#d9dee7" vertical horizontal={false} />
            <XAxis
              type="number"
              domain={[-domainPadding, domainPadding]}
              allowDecimals={false}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--heroui-divider))" }}
              tick={{ fontSize: 14 }}
              tickFormatter={(value) => formatSignedNumber(Number(value))}
              className="text-xs text-default-400"
            />
            <YAxis
              type="category"
              dataKey="skill"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 14 }}
              width={124}
              className="text-xs text-default-500"
            />
            <ReferenceLine
              x={0}
              stroke="#b8c0cc"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
            />
            <Tooltip
              cursor={{ fill: "rgba(15, 23, 42, 0.035)" }}
              content={<SkillBalanceTooltip />}
              isAnimationActive={false}
            />
            <Bar
              dataKey="supplyBalance"
              radius={[8, 8, 8, 8]}
              barSize={20}
              isAnimationActive
              animationDuration={700}
            >
              {normalizedData.map((item) => (
                <Cell
                  key={`skill-balance-${item.skill}`}
                  className="transition-opacity duration-150 hover:opacity-85"
                  fill={
                    item.supplyBalance < 0
                      ? "#df7048"
                      : item.supplyBalance > 0
                        ? "#8ec77f"
                        : "#98a2b3"
                  }
                />
              ))}
              <LabelList
                dataKey="supplyBalance"
                content={<SkillBalanceLabel />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid w-full gap-2 rounded-xl border border-divider bg-content2/50 px-4 py-3 text-sm text-default-500 sm:grid-cols-3">
        <span className="sm:text-left">
          <strong className="font-semibold text-[#bd4b25]">Negative:</strong>{" "}
          Demand exceeds supply
        </span>
        <span className="sm:text-center">
          <strong className="font-semibold text-foreground">Zero:</strong>{" "}
          Balanced
        </span>
        <span className="sm:text-right">
          <strong className="font-semibold text-[#2f7f4f]">Positive:</strong>{" "}
          Supply exceeds demand
        </span>
      </div>
    </div>
  );
};
