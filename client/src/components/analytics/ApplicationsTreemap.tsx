import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { EmptyChart } from "./EmptyChart";
import { ApplicationsTreemapNode } from "./ApplicationsTreemapNode";
import { ApplicationsTreemapTooltip } from "./ApplicationsTreemapTooltip";
import { statusLabel } from "../../lib/analytics-utils";

export const ApplicationsTreemap = ({
  data,
}: {
  data: AnalyticsChartRecord[];
}) => {
  if (data.length === 0) {
    return (
      <EmptyChart label="No company application data available for this range." />
    );
  }

  const normalizedData = data.map((item) => ({
    name: statusLabel(item.company),
    value: Number(item.value ?? item.applications ?? 0),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={normalizedData}
          dataKey="value"
          nameKey="name"
          aspectRatio={4 / 3}
          content={<ApplicationsTreemapNode />}
          isAnimationActive={false}
        >
          <Tooltip
            content={<ApplicationsTreemapTooltip />}
            isAnimationActive={false}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
