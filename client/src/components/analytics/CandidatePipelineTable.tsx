import { Chip, Input, ListBox, Select, Table } from "@heroui/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { getRecordNumber, getRecordString, statusLabel } from "../../lib/analytics-utils";
import { formatDateTime } from "../../lib/date-format";
import { EmptyChart } from "./EmptyChart";

const getStatusColor = (status: string): "accent" | "danger" | "default" | "success" | "warning" => {
  if (status === "Hired" || status === "Completed") return "success";
  if (status === "Rejected" || status === "Withdrawn" || status === "Cancelled") return "danger";
  if (status === "UnderReview" || status === "Scheduled") return "warning";
  if (status === "Submitted" || status === "Interviewing") return "accent";
  return "default";
};

export const CandidatePipelineTable = ({
  data,
  showPosting = true,
}: {
  data: AnalyticsChartRecord[];
  showPosting?: boolean;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statuses = useMemo(
    () => Array.from(new Set(data.map((item) => getRecordString(item, "applicationStatus")).filter(Boolean))).sort(),
    [data],
  );
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((item) => {
      const applicationStatus = getRecordString(item, "applicationStatus");
      const matchesStatus = statusFilter === "all" || applicationStatus === statusFilter;
      const matchesSearch =
        !query ||
        [
          getRecordString(item, "candidateName"),
          getRecordString(item, "candidateEmail"),
          getRecordString(item, "companyName"),
          getRecordString(item, "jobPostingTitle"),
          getRecordString(item, "stageTitle"),
          applicationStatus,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [data, search, statusFilter]);

  if (data.length === 0) {
    return <EmptyChart label="No candidate applications in the selected date range." />;
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap justify-end gap-3">
        <Input
          aria-label="Search candidate pipeline"
          className="h-10 min-w-64 flex-1 rounded-lg text-sm"
          fullWidth
          placeholder="Search candidates, postings, or stages"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          selectedKey={statusFilter}
          onSelectionChange={(key) => setStatusFilter(key ? String(key) : "all")}
        >
          <Select.Trigger
            aria-label="Filter candidate pipeline by status"
            className="h-10 min-w-44 rounded-lg text-sm"
          >
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label="Candidate pipeline status options">
              <ListBox.Item id="all" textValue="All statuses">
                All statuses
              </ListBox.Item>
              {statuses.map((status) => (
                <ListBox.Item key={status} id={status} textValue={statusLabel(status)}>
                  {statusLabel(status)}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {filteredData.length === 0 ? (
        <EmptyChart label="No candidates match the current filters." />
      ) : (
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Candidate pipeline">
              <Table.Header>
                <Table.Column isRowHeader>Candidate</Table.Column>
                {showPosting && <Table.Column>Posting</Table.Column>}
                <Table.Column>Application status</Table.Column>
                <Table.Column>Interview stage</Table.Column>
                <Table.Column>Updated</Table.Column>
              </Table.Header>
              <Table.Body>
                {filteredData.map((item) => {
                  const applicationId = getRecordNumber(item, "applicationId");
                  const applicationStatus = getRecordString(item, "applicationStatus");
                  const stageTitle = getRecordString(item, "stageTitle");
                  const stageStatus = getRecordString(item, "stageStatus");
                  const scheduledAt = getRecordString(item, "stageScheduledAt");

                  return (
                    <Table.Row key={applicationId} id={applicationId}>
                      <Table.Cell>
                        <Link
                          className="font-medium text-foreground underline decoration-divider underline-offset-4 hover:decoration-foreground"
                          to={`/panel/job-applications/${applicationId}`}
                        >
                          {getRecordString(item, "candidateName") || "Unnamed candidate"}
                        </Link>
                        <span className="mt-1 block text-xs text-default-500">
                          {getRecordString(item, "candidateEmail")}
                        </span>
                      </Table.Cell>
                      {showPosting && (
                        <Table.Cell>
                          <span>{getRecordString(item, "jobPostingTitle") || "Untitled posting"}</span>
                          {getRecordString(item, "companyName") && (
                            <span className="mt-1 block text-xs text-default-500">
                              {getRecordString(item, "companyName")}
                            </span>
                          )}
                        </Table.Cell>
                      )}
                      <Table.Cell>
                        <Chip className="rounded-md" color={getStatusColor(applicationStatus)} size="sm" variant="soft">
                          {statusLabel(applicationStatus)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-medium text-foreground">
                          {stageTitle ||
                            (applicationStatus === "Submitted" || applicationStatus === "UnderReview"
                              ? "Not started"
                              : "No recorded stage")}
                        </span>
                        {stageStatus && (
                          <span className="mt-1 flex items-center gap-2 text-xs text-default-500">
                            <Chip className="rounded-md" color={getStatusColor(stageStatus)} size="sm" variant="soft">
                              {statusLabel(stageStatus)}
                            </Chip>
                            {scheduledAt ? `Scheduled ${formatDateTime(scheduledAt)}` : null}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-default-500">
                          {formatDateTime(getRecordString(item, "applicationUpdatedAt"))}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </div>
  );
};
