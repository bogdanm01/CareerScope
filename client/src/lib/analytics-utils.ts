import type { AnalyticsChartRecord, AnalyticsStat } from "./analytics-api";

export const chartColors = [
  "#c6532a",
  "#2f8a64",
  "#3c4b63",
  "#ad7816",
  "#8061c7",
  "#c94f4f",
  "#34789a",
  "#77891f",
  "#a2527e",
  "#758197",
];

export const rankBadgeColors = [
  { background: "#f7e4d8", text: "#9f3f18" },
  { background: "#dff2eb", text: "#1d6d50" },
  { background: "#ece5f8", text: "#664ab0" },
] as const;
export const neutralRankBadgeColor = {
  background: "#eef1f5",
  text: "#596273",
} as const;

export const trendColor = "#b84a1b";
export const trendFill = "#b84a1b";

export const statusLabel = (value: string | number | null | undefined) => {
  if (value === "UnderReview") return "Under Review";
  if (value === "PendingApproval") return "Pending approval";
  if (value === "OnSite") return "On-site";
  if (value === "FullTime") return "Full-time";
  if (value === "PartTime") return "Part-time";
  return value?.toString() ?? "Unknown";
};

export const formatChartDate = (value: string | number | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}`);

  if (Number.isNaN(date.getTime())) {
    return value.toString();
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const getRecordNumber = (record: AnalyticsChartRecord, key: string) => {
  const value = record[key];
  return typeof value === "number" ? value : Number(value ?? 0);
};

export const getRecordString = (record: AnalyticsChartRecord, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : (value?.toString() ?? "");
};

export const getStatValue = (stats: AnalyticsStat[], key: string) =>
  stats.find((stat) => stat.key === key)?.value ?? 0;

export const formatSignedNumber = (value: number) =>
  value > 0 ? `+${value}` : `${value}`;
