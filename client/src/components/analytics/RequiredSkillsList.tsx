import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { statusLabel, getRecordNumber } from "../../lib/analytics-utils";
import { EmptyChart } from "./EmptyChart";

export const RequiredSkillsList = ({
  data,
}: {
  data: AnalyticsChartRecord[];
}) => {
  if (data.length === 0) {
    return (
      <EmptyChart label="No required skills configured for this posting." />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item, index) => (
        <span
          key={`${item.skill}-${index}`}
          className="inline-flex items-center gap-2 rounded-full border border-divider bg-content2/50 px-3 py-1.5"
        >
          <span className="text-sm font-medium text-foreground">
            {statusLabel(item.skill)}
          </span>
          <span className="text-xs font-medium text-default-500">
            {getRecordNumber(item, "yoe") > 0
              ? `${getRecordNumber(item, "yoe")}y`
              : "Any exp"}
          </span>
        </span>
      ))}
    </div>
  );
};
