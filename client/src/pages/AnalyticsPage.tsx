import { useEffect, useMemo, useState } from "react";
import { Button, Calendar, Card, Chip, DateField, DatePicker, Modal, useOverlayState } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  getAnalyticsOverview,
  type AnalyticsChartRecord,
  type AnalyticsOverview,
  type AnalyticsStat,
} from "../lib/analytics-api";
import { formatDate } from "../lib/date-format";

const chartColors = [
  "#b84a1b",
  "#1f7a58",
  "#334155",
  "#9a650f",
  "#7353b8",
  "#bf4343",
  "#2f6f91",
  "#6f7f1e",
  "#9a4b73",
  "#68758d",
];

const trendColor = "#b84a1b";
const trendFill = "#b84a1b";

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysAgoIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const statIconMap: Record<
  string,
  { icon: typeof ClipboardCheck; className: string }
> = {
  applications: { icon: ClipboardCheck, className: "bg-[#aa2d00] text-white" },
  underReview: { icon: CircleDot, className: "bg-[#f5e9d4] text-[#8a5a12]" },
  accepted: { icon: CheckCircle2, className: "bg-[#e8f8f1] text-[#19734f]" },
  selectedSkills: { icon: BarChart3, className: "bg-content2 text-foreground" },
  cvUploaded: { icon: ShieldCheck, className: "bg-[#e8f8f1] text-[#19734f]" },
  profileCompleted: {
    icon: CheckCircle2,
    className: "bg-[#e8f8f1] text-[#19734f]",
  },
  postings: { icon: BriefcaseBusiness, className: "bg-[#181d26] text-white" },
  activePostings: {
    icon: BriefcaseBusiness,
    className: "bg-[#0a2e0e] text-white",
  },
  pendingPostings: {
    icon: ClipboardCheck,
    className: "bg-[#f5e9d4] text-[#8a5a12]",
  },
  companies: { icon: Building2, className: "bg-[#181d26] text-white" },
  pendingCompanies: {
    icon: Building2,
    className: "bg-[#f5e9d4] text-[#8a5a12]",
  },
  approvedCompanies: {
    icon: ShieldCheck,
    className: "bg-[#e8f8f1] text-[#19734f]",
  },
};

const roleCopy = {
  Candidate: {
    title: "Your analytics",
    description:
      "Track application progress and profile readiness from one place.",
  },
  Recruiter: {
    title: "Company analytics",
    description:
      "Review posting performance and application activity for your company.",
  },
  Admin: {
    title: "Platform analytics",
    description:
      "Monitor companies, postings, applications, users, and skill demand across the platform.",
  },
} as const;

const statusLabel = (value: string | number | null | undefined) => {
  if (value === "UnderReview") return "Under Review";
  if (value === "PendingApproval") return "Pending approval";
  return value?.toString() ?? "Unknown";
};

const formatChartDate = (value: string | number | null | undefined) => {
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

const getStatDisplayValue = (stat: AnalyticsStat) => {
  if (stat.key === "cvUploaded" || stat.key === "profileCompleted") {
    return stat.value > 0 ? "Yes" : "No";
  }

  return stat.value;
};

const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-divider bg-content2/40 px-6 text-center text-sm text-default-500">
    {label}
  </div>
);

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="border border-divider shadow-none">
    <Card.Content className="p-5">
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </Card.Content>
  </Card>
);

const RangeDatePicker = ({
  label,
  value,
  onChange,
  maxValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxValue?: string;
}) => (
  <div className="grid gap-1.5">
    <span className="text-xs font-medium text-default-500">{label}</span>
    <DatePicker
      className="w-full"
      aria-label={label}
      value={value ? parseDate(value) : null}
      onChange={(dateValue) => onChange(dateValue?.toString() ?? "")}
      maxValue={maxValue ? parseDate(maxValue) : undefined}
    >
      <DateField.Group fullWidth className="min-h-[40px] rounded-lg">
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover className="!w-[320px] !min-w-[320px] max-w-[calc(100vw-2rem)]">
        <Calendar className="!w-[320px] max-w-full">
          <Calendar.Header>
            <Calendar.NavButton slot="previous" />
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => (
                <Calendar.Cell date={date}>
                  {({ formattedDate }) => (
                    <>
                      {formattedDate}
                      <Calendar.CellIndicator />
                    </>
                  )}
                </Calendar.Cell>
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  </div>
);

const StatCard = ({ stat }: { stat: AnalyticsStat }) => {
  const iconConfig = statIconMap[stat.key] ?? {
    icon: TrendingUp,
    className: "bg-content2 text-foreground",
  };
  const StatIcon = iconConfig.icon;

  return (
    <Card className="border border-divider shadow-none">
      <Card.Content className="!flex min-h-20 !flex-row !items-center !justify-start gap-5 p-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconConfig.className}`}
        >
          <StatIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <span className="block truncate text-sm text-default-500">
            {stat.label}
          </span>
          <strong className="mt-1 block text-2xl font-medium leading-none text-foreground">
            {getStatDisplayValue(stat)}
          </strong>
        </div>
      </Card.Content>
    </Card>
  );
};

const TrendLineChart = ({ data }: { data: AnalyticsChartRecord[] }) => {
  if (data.length === 0) {
    return <EmptyChart label="No trend data available for this range." />;
  }

  const normalizedData = data.map((item) => ({
    ...item,
    label: formatChartDate(item.date),
  }));

  return (
    <div className="h-76">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={normalizedData}
          margin={{ top: 12, right: 18, left: -6, bottom: 0 }}
        >
          <defs>
            <linearGradient id="applicationsTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendFill} stopOpacity={0.34} />
              <stop offset="95%" stopColor={trendFill} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-default-200" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={28}
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
            labelFormatter={(_, payload) => formatChartDate(payload?.[0]?.payload?.date)}
            formatter={(value) => [value, "Applications"]}
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
            fill="url(#applicationsTrendFill)"
            activeDot={{ r: 5, strokeWidth: 3, stroke: "#ffffff", fill: trendColor }}
            dot={{ r: 3, strokeWidth: 2, stroke: trendColor, fill: "#ffffff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatusBarChart = ({
  data,
  labelKey = "status",
}: {
  data: AnalyticsChartRecord[];
  labelKey?: string;
}) => {
  if (data.length === 0) {
    return <EmptyChart label="No status data available for this range." />;
  }

  const normalizedData: Array<AnalyticsChartRecord & { label: string }> =
    data.map((item) => ({
      ...item,
      label: statusLabel(item[labelKey]),
    }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={normalizedData} margin={{ top: 12, right: 16, left: -6, bottom: 10 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-default-200" />
          <XAxis
            dataKey="label"
            interval={0}
            angle={-28}
            textAnchor="end"
            tickLine={false}
            axisLine={false}
            height={78}
            className="text-xs text-default-400"
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} className="text-xs text-default-400" />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            formatter={(value) => [value, "Postings"]}
            contentStyle={{
              borderRadius: 12,
              borderColor: "hsl(var(--heroui-divider))",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {normalizedData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const PieStatusChart = ({
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

  return (
    <div className="grid gap-4">
      <div className="mx-auto h-60 w-full max-w-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalizedData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="54%"
              outerRadius="76%"
              paddingAngle={4}
              cornerRadius={8}
            >
              {normalizedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2">
        {normalizedData.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex min-w-0 items-center gap-2 text-default-500">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <strong className="font-medium text-foreground">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopList = ({
  data,
  labelKey,
}: {
  data: AnalyticsChartRecord[];
  labelKey: string;
}) => {
  if (data.length === 0) {
    return <EmptyChart label="No ranked data available yet." />;
  }

  return (
    <div className="grid gap-2">
      {data.map((item, index) => (
        <div
          key={`${item[labelKey]}-${index}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-divider bg-content2/40 px-4 py-3"
        >
          <div className="inline-flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-sm text-default-500">#{index + 1}</span>
            <span className="truncate text-sm font-medium text-foreground">
              {statusLabel(item[labelKey])}
            </span>
          </div>
          <Chip className="rounded-lg" variant="secondary">
            {item.value ?? item.applications ?? 0}
          </Chip>
        </div>
      ))}
    </div>
  );
};

const CandidateCharts = ({ overview }: { overview: AnalyticsOverview }) => (
  <div className="grid gap-4 xl:grid-cols-2">
    <ChartCard title="Applications by status">
      <PieStatusChart data={overview.charts.applicationsByStatus ?? []} />
    </ChartCard>
    <ChartCard title="Applications over time">
      <TrendLineChart data={overview.charts.applicationsOverTime ?? []} />
    </ChartCard>
  </div>
);

const RecruiterCharts = ({ overview }: { overview: AnalyticsOverview }) => (
  <div className="grid gap-4">
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Applications by status">
        <PieStatusChart data={overview.charts.applicationsByStatus ?? []} />
      </ChartCard>
      <ChartCard title="Postings by status">
        <StatusBarChart data={overview.charts.postingsByStatus ?? []} />
      </ChartCard>
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Applications over time">
        <TrendLineChart data={overview.charts.applicationsOverTime ?? []} />
      </ChartCard>
      <ChartCard title="Top postings by applications">
        <TopList data={overview.charts.topPostings ?? []} labelKey="title" />
      </ChartCard>
    </div>
  </div>
);

const AdminCharts = ({ overview }: { overview: AnalyticsOverview }) => (
  <div className="grid gap-4">
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard title="Companies by status">
        <PieStatusChart data={overview.charts.companiesByStatus ?? []} />
      </ChartCard>
      <ChartCard title="Applications by status">
        <PieStatusChart data={overview.charts.applicationsByStatus ?? []} />
      </ChartCard>
      <ChartCard title="Users by role">
        <PieStatusChart data={overview.charts.usersByRole ?? []} labelKey="role" />
      </ChartCard>
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Applications over time">
        <TrendLineChart data={overview.charts.applicationsOverTime ?? []} />
      </ChartCard>
      <ChartCard title="Postings by status">
        <StatusBarChart data={overview.charts.postingsByStatus ?? []} />
      </ChartCard>
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Top skills by posting demand">
        <TopList
          data={overview.charts.topSkillsByPostingDemand ?? []}
          labelKey="skill"
        />
      </ChartCard>
      <ChartCard title="Top skills by candidate supply">
        <TopList
          data={overview.charts.topSkillsByCandidateSupply ?? []}
          labelKey="skill"
        />
      </ChartCard>
    </div>
  </div>
);

export const AnalyticsPage = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const rangeModal = useOverlayState();

  const loadOverview = async (range?: { from?: string; to?: string }) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getAnalyticsOverview(range);
      setOverview(response.data);
      setFromDate(response.data.range.from);
      setToDate(response.data.range.to);
      return true;
    } catch (error) {
      setOverview(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load analytics.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const openRangeModal = () => {
    if (overview) {
      setFromDate(overview.range.from);
      setToDate(overview.range.to);
    }

    setRangeError(null);
    rangeModal.open();
  };

  const applyRange = async () => {
    setRangeError(null);

    if (!fromDate || !toDate) {
      setRangeError("Choose both start and end dates.");
      return;
    }

    if (fromDate > toDate) {
      setRangeError("Start date must be before end date.");
      return;
    }

    const success = await loadOverview({ from: fromDate, to: toDate });

    if (success) {
      rangeModal.close();
    }
  };

  const resetRange = () => {
    const to = todayIso();
    const from = daysAgoIso(29);

    setRangeError(null);
    setFromDate(from);
    setToDate(to);
  };

  const copy = overview ? roleCopy[overview.role] : roleCopy.Candidate;
  const statRows = useMemo(() => overview?.stats ?? [], [overview]);

  return (
    <div className="grid gap-5">
      <section className="pt-6 sm:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-default-500">
              {copy.description}
            </p>
          </div>
          {overview && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-lg"
              onPress={openRangeModal}
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(overview.range.from)} – {formatDate(overview.range.to)}
              </span>
            </Button>
          )}
        </div>
      </section>

      <Modal state={rangeModal}>
        <Modal.Backdrop>
          <Modal.Container size="md" placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Analytics date range</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-4 sm:grid-cols-2">
                  <RangeDatePicker
                    label="From"
                    value={fromDate}
                    onChange={setFromDate}
                    maxValue={toDate || undefined}
                  />
                  <RangeDatePicker
                    label="To"
                    value={toDate}
                    onChange={setToDate}
                  />
                </div>
                {rangeError && (
                  <p className="text-sm text-danger-600">{rangeError}</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="rounded-lg"
                  variant="secondary"
                  onPress={resetRange}
                  isDisabled={loading}
                >
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </span>
                </Button>
                <Button
                  className="rounded-lg"
                  variant="primary"
                  onPress={() => void applyRange()}
                  isDisabled={loading}
                >
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Apply range
                  </span>
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {loading && (
        <Card className="border border-divider shadow-none">
          <Card.Content className="p-6 text-sm text-default-500">
            Loading analytics...
          </Card.Content>
        </Card>
      )}

      {errorMessage && !loading && (
        <Card className="border border-danger-200 bg-danger-50 shadow-none">
          <Card.Content className="p-6">
            <p className="text-sm text-danger-700">{errorMessage}</p>
          </Card.Content>
        </Card>
      )}

      {overview && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statRows.map((stat) => (
              <StatCard key={stat.key} stat={stat} />
            ))}
          </div>

          {overview.role === "Candidate" && (
            <CandidateCharts overview={overview} />
          )}
          {overview.role === "Recruiter" && (
            <RecruiterCharts overview={overview} />
          )}
          {overview.role === "Admin" && <AdminCharts overview={overview} />}
        </>
      )}
    </div>
  );
};
