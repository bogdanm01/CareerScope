import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Modal, Tabs, useOverlayState } from "@heroui/react";
import { useAtomValue } from "jotai";

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Globe2,
  RotateCcw,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getAnalyticsOverview,
  getRecruiterJobPostingAnalytics,
  type AnalyticsOverviewQuery,
  type AnalyticsOverview,
  type AnalyticsRole,
  type RecruiterJobPostingAnalytics,
} from "../lib/analytics-api";
import { authSessionAtom } from "../store/auth";
import { formatDate } from "../lib/date-format";
import { ApplicationFunnel } from "../components/analytics/ApplicationFunnel";
import { DashboardSection } from "../components/analytics/DashboardSection";
import { RangeDatePicker } from "./RangeDatePicker";
import { SkillGapChart } from "../components/analytics/SkillGapChart";
import { PieStatusChart } from "../components/analytics/PieStatusChart";
import { TopList } from "../components/analytics/TopList";
import { TrendLineChart } from "../components/analytics/TrendLineChart";
import { ChartCard } from "../components/analytics/ChartCard";
import { PostingTrendChart } from "../components/analytics/PostingTrendChart";
import { PostingPerformanceList } from "../components/analytics/PostingPerformanceList";
import { DailyApplicationsBarChart } from "../components/analytics/DailyApplicationsBarChart";
import { ApplicationsTreemap } from "../components/analytics/ApplicationsTreemap";
import { CategoryBarChart } from "../components/analytics/CategoryBarChart";
import { getRecordNumber, getRecordString, statusLabel } from "../lib/analytics-utils";
import { CompactStatCard } from "../components/analytics/CompactStatCard";
import { CandidatePipelineTable } from "../components/analytics/CandidatePipelineTable";
import { useRecruiterPostingAccess } from "../hooks/useRecruiterPostingAccess";
import { CompanyApprovalRequiredCard } from "../components/CompanyApprovalRequiredCard";

const todayIso = () => new Date().toISOString().slice(0, 10);

const previousMonthStartIso = () => {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  return date.toISOString().slice(0, 10);
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

const MetricGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
);

type RecruiterAnalyticsTab = "overview" | "postings";

const CandidateCharts = ({ overview }: { overview: AnalyticsOverview }) => (
  <div className="grid gap-6">
    <DashboardSection title="Application progress">
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Applications over time"
          subtitle="Cumulative applications in the selected range."
          icon={TrendingUp}
        >
          <TrendLineChart data={overview.charts.applicationsOverTime ?? []} />
        </ChartCard>
        <ChartCard
          title="Applications by status"
          subtitle="Current status mix for your applications."
          icon={FileText}
        >
          <PieStatusChart data={overview.charts.applicationsByStatus ?? []} />
        </ChartCard>
      </div>
    </DashboardSection>
  </div>
);

const RecruiterCharts = ({
  overview,
  selectedTab,
}: {
  overview: AnalyticsOverview;
  selectedTab: "overview" | "postings";
}) => {
  const postingPerformance = useMemo(
    () => overview.charts.postingPerformance ?? overview.charts.topPostings ?? [],
    [overview.charts.postingPerformance, overview.charts.topPostings],
  );
  const [selectedPostingId, setSelectedPostingId] = useState<number | null>(
    null,
  );
  const [postingDetail, setPostingDetail] =
    useState<RecruiterJobPostingAnalytics | null>(null);
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingError, setPostingError] = useState<string | null>(null);
  const [postingSearch, setPostingSearch] = useState("");
  const filteredPostingPerformance = useMemo(() => {
    const query = postingSearch.trim().toLowerCase();

    if (!query) {
      return postingPerformance;
    }

    return postingPerformance.filter((item) => {
      const searchableText = [
        getRecordString(item, "title"),
        statusLabel(item.status),
        getRecordString(item, "expiresAt"),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [postingPerformance, postingSearch]);
  const effectiveSelectedPostingId = useMemo(() => {
    if (filteredPostingPerformance.length === 0) {
      return null;
    }

    const hasSelectedPosting = filteredPostingPerformance.some(
      (item) => getRecordNumber(item, "id") === selectedPostingId,
    );

    return hasSelectedPosting
      ? selectedPostingId
      : getRecordNumber(filteredPostingPerformance[0], "id");
  }, [filteredPostingPerformance, selectedPostingId]);

  useEffect(() => {
    if (!effectiveSelectedPostingId) {
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setPostingLoading(true);
      setPostingError(null);

      getRecruiterJobPostingAnalytics(
        effectiveSelectedPostingId,
        overview.range,
      )
        .then((response) => {
          if (isMounted) {
            setPostingDetail(response.data);
          }
        })
        .catch((error) => {
          if (isMounted) {
            setPostingDetail(null);
            setPostingError(
              error instanceof Error
                ? error.message
                : "Unable to load posting analytics.",
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setPostingLoading(false);
          }
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [overview.range, effectiveSelectedPostingId]);

  return (
    <div className="grid gap-6">
      {selectedTab === "overview" && (
        <>
          <DashboardSection title="Company hiring trends">
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard
                title="Applications over time"
                subtitle="Cumulative candidate applications."
                icon={TrendingUp}
              >
                <TrendLineChart
                  data={overview.charts.applicationsOverTime ?? []}
                />
              </ChartCard>
              <ChartCard
                title="Daily applications"
                subtitle="New applications received each day."
                icon={BarChart3}
              >
                <DailyApplicationsBarChart
                  data={overview.charts.applicationsOverTime ?? []}
                />
              </ChartCard>
            </div>
          </DashboardSection>
          <DashboardSection title="Company breakdowns">
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Applications by status" icon={FileText}>
                <PieStatusChart
                  data={overview.charts.applicationsByStatus ?? []}
                />
              </ChartCard>
              <ChartCard title="Postings by status" icon={BriefcaseBusiness}>
                <PieStatusChart data={overview.charts.postingsByStatus ?? []} />
              </ChartCard>
            </div>
          </DashboardSection>
        </>
      )}

      {selectedTab === "postings" && (
        <>
          <section className="grid w-full gap-4 pt-3 first:pt-0">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="min-w-0">
                <h2 className="text-xl font-medium tracking-[-0.01em] text-foreground">
                  Posting performance
                </h2>
                <p className="mt-1 text-sm leading-6 text-default-500">
                  Select a posting to inspect its application flow and
                  requirements. Application counts use the selected date range.
                </p>
              </div>
              <div className="relative ml-auto w-80 max-w-full justify-self-end">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-default-400" />
                <input
                  aria-label="Search postings"
                  placeholder="Search postings"
                  value={postingSearch}
                  onChange={(event) => setPostingSearch(event.target.value)}
                  className="h-10 w-full rounded-lg border border-divider bg-content1 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-sm placeholder:text-default-500 hover:border-default-300 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                />
              </div>
            </div>
            <PostingPerformanceList
              data={filteredPostingPerformance}
              emptyLabel={
                postingSearch.trim()
                  ? "No postings match your search."
                  : "No company postings available yet."
              }
              selectedPostingId={effectiveSelectedPostingId}
              onSelect={setSelectedPostingId}
            />
          </section>

          <DashboardSection title="Selected posting analytics">
            {!effectiveSelectedPostingId && (
              <Card className="rounded-xl border border-divider shadow-none">
                <Card.Content className="p-6 text-sm text-default-500">
                  Create a job posting to see posting-level analytics.
                </Card.Content>
              </Card>
            )}
            {effectiveSelectedPostingId && postingLoading && !postingDetail && (
              <Card className="rounded-xl border border-divider shadow-none">
                <Card.Content className="p-6 text-sm text-default-500">
                  Loading posting analytics...
                </Card.Content>
              </Card>
            )}
            {effectiveSelectedPostingId && postingError && !postingLoading && (
              <Card className="rounded-xl border border-danger-200 bg-danger-50 shadow-none">
                <Card.Content className="p-6">
                  <p className="text-sm text-danger-700">{postingError}</p>
                </Card.Content>
              </Card>
            )}

            {effectiveSelectedPostingId &&
              postingDetail &&
              !postingError && (
                <div
                  className={`grid gap-4 transition-opacity duration-150 ${
                    postingLoading ? "opacity-75" : "opacity-100"
                  }`}
                >
                  <div className="grid gap-4 xl:grid-cols-2">
                    <ChartCard
                      title="Applications over time"
                      subtitle="Cumulative applications for this posting."
                      icon={TrendingUp}
                    >
                      <PostingTrendChart
                        data={postingDetail.charts.applicationsOverTime ?? []}
                        type="trend"
                      />
                    </ChartCard>
                    <ChartCard
                      title="Daily applications"
                      subtitle="Daily application volume for this posting."
                      icon={BarChart3}
                    >
                      <PostingTrendChart
                        data={postingDetail.charts.applicationsOverTime ?? []}
                        type="daily"
                      />
                    </ChartCard>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <ChartCard
                      title="Application funnel"
                      subtitle="Current movement through review outcomes."
                      icon={FileText}
                    >
                      <ApplicationFunnel stats={postingDetail.stats} />
                    </ChartCard>
                    <ChartCard
                      title="Candidates by interview stage"
                      subtitle="Current stages for this posting."
                      icon={Users}
                    >
                      <CategoryBarChart
                        data={postingDetail.charts.interviewStages ?? []}
                        labelKey="stage"
                        emptyLabel="No candidates are currently in interview stages."
                        valueLabel="Candidates"
                      />
                    </ChartCard>
                  </div>
                  <div className="grid gap-4">
                    <ChartCard
                      title="Candidate pipeline"
                      subtitle="Application outcomes and recorded interview progress."
                      icon={Users}
                    >
                      <CandidatePipelineTable
                        data={postingDetail.charts.candidatePipeline ?? []}
                        showPosting={false}
                      />
                    </ChartCard>
                  </div>
                </div>
              )}
          </DashboardSection>
        </>
      )}
    </div>
  );
};

const AdminCharts = ({ overview }: { overview: AnalyticsOverview }) => (
  <div className="grid gap-6">
    <DashboardSection
      title="Application trends"
      description="Compare cumulative application growth with daily submission volume."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Applications over time"
          subtitle="Cumulative total over the selected range."
          icon={TrendingUp}
        >
          <TrendLineChart data={overview.charts.applicationsOverTime ?? []} />
        </ChartCard>
        <ChartCard
          title="Daily applications"
          subtitle="New applications received each day."
          icon={BarChart3}
        >
          <DailyApplicationsBarChart
            data={overview.charts.applicationsOverTime ?? []}
          />
        </ChartCard>
      </div>
    </DashboardSection>
    <DashboardSection
      title="Application flow"
      description="See where applications concentrate and how quickly they move past submission."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Applications per company"
          subtitle="Companies receiving the most applications in this range."
          icon={Building2}
        >
          <ApplicationsTreemap
            data={overview.charts.applicationsPerCompany ?? []}
          />
        </ChartCard>
        <ChartCard
          title="Application review speed"
          subtitle="Time from submission to a reviewed status."
          icon={ClipboardCheck}
        >
          <CategoryBarChart
            data={overview.charts.applicationReviewSpeed ?? []}
            labelKey="bucket"
            emptyLabel="No reviewed applications available for this range."
            valueLabel="Applications"
          />
        </ChartCard>
      </div>
    </DashboardSection>
    <DashboardSection
      title="Operational breakdown"
      description="Current platform composition across companies, applications, users, and postings."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Companies by status" icon={Building2}>
          <PieStatusChart data={overview.charts.companiesByStatus ?? []} />
        </ChartCard>
        <ChartCard title="Users by role" icon={Users}>
          <PieStatusChart
            data={overview.charts.usersByRole ?? []}
            labelKey="role"
          />
        </ChartCard>
        <ChartCard title="Active jobs by work location" icon={Globe2}>
          <PieStatusChart
            data={overview.charts.activeJobsByWorkLocation ?? []}
            labelKey="location"
          />
        </ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Applications by status" icon={FileText}>
          <PieStatusChart data={overview.charts.applicationsByStatus ?? []} />
        </ChartCard>
        <ChartCard title="Postings by status" icon={BriefcaseBusiness}>
          <PieStatusChart data={overview.charts.postingsByStatus ?? []} />
        </ChartCard>
      </div>
    </DashboardSection>
    <DashboardSection
      title="Skill demand and supply"
      description="Compare required skills in postings against candidate profile skills."
    >
      <div className="grid gap-4">
        <ChartCard
          title="Skill Supply Balance"
          subtitle="Negative values indicate demand exceeds candidate supply."
          icon={BarChart3}
        >
          <SkillGapChart data={overview.charts.skillDemandSupplyGap ?? []} />
        </ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Top skills by posting demand"
          icon={BriefcaseBusiness}
        >
          <TopList
            data={overview.charts.topSkillsByPostingDemand ?? []}
            labelKey="skill"
            columns
          />
        </ChartCard>
        <ChartCard title="Top skills by candidate supply" icon={Users}>
          <TopList
            data={overview.charts.topSkillsByCandidateSupply ?? []}
            labelKey="skill"
            columns
          />
        </ChartCard>
      </div>
    </DashboardSection>
  </div>
);

export const AnalyticsPage = () => {
  const session = useAtomValue(authSessionAtom);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRecruiterTab, setSelectedRecruiterTab] =
    useState<RecruiterAnalyticsTab>("overview");
  const rangeModal = useOverlayState();
  const sessionRole = session?.user.role as AnalyticsRole | undefined;
  const isRecruiter = sessionRole === "Recruiter";
  const {
    company: recruiterCompany,
    loading: companyApprovalLoading,
    error: companyApprovalError,
    canCreatePosting: isRecruiterCompanyApproved,
  } = useRecruiterPostingAccess(isRecruiter);
  const recruiterAnalyticsBlocked =
    isRecruiter && !companyApprovalLoading && !isRecruiterCompanyApproved;

  const loadOverview = useCallback(
    async (
      range?: { from?: string; to?: string },
      view?: RecruiterAnalyticsTab,
      syncDateInputs = true,
    ) => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const query: AnalyticsOverviewQuery = {
          ...range,
          ...(sessionRole === "Recruiter" ? { view: view ?? "overview" } : {}),
        };
        const response = await getAnalyticsOverview(query);
        setOverview(response.data);

        if (syncDateInputs) {
          setFromDate(response.data.range.from);
          setToDate(response.data.range.to);
        }

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
    },
    [sessionRole],
  );

  useEffect(() => {
    if (isRecruiter && (companyApprovalLoading || !isRecruiterCompanyApproved)) {
      return;
    }

    const timeoutId = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [companyApprovalLoading, isRecruiter, isRecruiterCompanyApproved, loadOverview]);

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

    const success = await loadOverview(
      { from: fromDate, to: toDate },
      selectedRecruiterTab,
    );

    if (success) {
      rangeModal.close();
    }
  };

  const resetRange = () => {
    const to = todayIso();
    const from = previousMonthStartIso();

    setRangeError(null);
    setFromDate(from);
    setToDate(to);
  };

  const activeRole = sessionRole ?? overview?.role ?? "Candidate";
  const copy = roleCopy[activeRole];
  const statRows = useMemo(() => overview?.stats ?? [], [overview]);

  const handleRecruiterTabChange = (key: React.Key) => {
    const nextTab = key === "postings" ? "postings" : "overview";
    setSelectedRecruiterTab(nextTab);

    if (overview) {
      void loadOverview(overview.range, nextTab, false);
    }
  };

  return (
    <div className="grid gap-6">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-default-500 sm:text-base sm:leading-7">
              {copy.description}
            </p>
          </div>
          {overview && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-lg"
              onPress={openRangeModal}
              isDisabled={loading && !overview}
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(overview.range.from)} –{" "}
                {formatDate(overview.range.to)}
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

      {recruiterAnalyticsBlocked && (
        <CompanyApprovalRequiredCard
          area="analytics"
          company={recruiterCompany}
          verificationError={companyApprovalError}
        />
      )}

      {!recruiterAnalyticsBlocked && (loading || companyApprovalLoading) && !overview && (
        <Card className="rounded-xl border border-divider shadow-none">
          <Card.Content className="p-6 text-sm text-default-500">
            Loading analytics...
          </Card.Content>
        </Card>
      )}

      {!recruiterAnalyticsBlocked && errorMessage && !loading && (
        <Card className="rounded-xl border border-danger-200 bg-danger-50 shadow-none">
          <Card.Content className="p-6">
            <p className="text-sm text-danger-700">{errorMessage}</p>
          </Card.Content>
        </Card>
      )}

      {!recruiterAnalyticsBlocked && overview && (
        <>
          {activeRole === "Recruiter" && (
            <Tabs
              className="w-full"
              selectedKey={selectedRecruiterTab}
              onSelectionChange={handleRecruiterTabChange}
            >
              <Tabs.ListContainer className="max-w-md">
                <Tabs.List aria-label="Options">
                  <Tabs.Tab id="overview">
                    Overview
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="postings">
                    Postings
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
              <Tabs.Panel id="overview" className="w-full">
                <div className="grid gap-6 pt-4">
                  <DashboardSection title="Key metrics">
                    <MetricGrid>
                      {statRows.map((stat) => (
                        <CompactStatCard key={stat.key} stat={stat} />
                      ))}
                    </MetricGrid>
                  </DashboardSection>
                  <RecruiterCharts
                    overview={overview}
                    selectedTab="overview"
                  />
                </div>
              </Tabs.Panel>
              <Tabs.Panel id="postings" className="w-full">
                <div className="pt-4">
                  <RecruiterCharts
                    overview={overview}
                    selectedTab="postings"
                  />
                </div>
              </Tabs.Panel>
            </Tabs>
          )}

          {activeRole !== "Recruiter" && (
          <DashboardSection title="Key metrics">
            <MetricGrid>
              {statRows.map((stat) => (
                <CompactStatCard key={stat.key} stat={stat} />
              ))}
            </MetricGrid>
          </DashboardSection>
          )}

          {activeRole === "Candidate" && (
            <CandidateCharts overview={overview} />
          )}

          {activeRole === "Admin" && <AdminCharts overview={overview} />}
        </>
      )}
    </div>
  );
};
