import { useMemo, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnalyticsChartRecord } from "../../lib/analytics-api";
import { formatDate } from "../../lib/date-format";
import {
  getRecordNumber,
  getRecordString,
  statusLabel,
} from "../../lib/analytics-utils";
import { EmptyChart } from "./EmptyChart";

const pageSize = 6;

export const PostingPerformanceList = ({
  data,
  emptyLabel = "No company postings available yet.",
  selectedPostingId,
  onSelect,
}: {
  data: AnalyticsChartRecord[];
  emptyLabel?: string;
  selectedPostingId: number | null;
  onSelect: (postingId: number) => void;
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage]);
  const firstVisibleItem =
    data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(currentPage * pageSize, data.length);

  if (data.length === 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-divider">
      <div className="grid grid-cols-[minmax(200px,1fr)_92px_96px_88px_88px_76px_92px] items-center gap-3 border-b border-divider bg-content2/60 px-3 py-2 text-xs font-medium text-default-500 max-lg:hidden">
        <span>Posting</span>
        <span>Status</span>
        <span>Applications</span>
        <span>CV review</span>
        <span>Interviewing</span>
        <span>Hired</span>
        <span>Rejected</span>
      </div>
      <div className="divide-y divide-divider">
        {pageItems.map((item) => {
          const postingId = getRecordNumber(item, "id");
          const isSelected = postingId === selectedPostingId;

          return (
            <button
              key={postingId}
              type="button"
              onClick={() => onSelect(postingId)}
              className={`grid w-full cursor-pointer gap-3 px-3 py-2.5 text-left transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 lg:grid-cols-[minmax(200px,1fr)_92px_96px_88px_88px_76px_92px] lg:items-center ${
                isSelected
                  ? "bg-[#f7e4d8]/50 hover:bg-[#f7e4d8]/70"
                  : "bg-content1 hover:bg-[#f7e4d8]/25 hover:shadow-[inset_3px_0_0_rgba(184,74,27,0.35)]"
              }`}
            >
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-foreground">
                  {getRecordString(item, "title") || "Untitled posting"}
                </h4>
                <p className="mt-0.5 text-xs text-default-500">
                  {getRecordString(item, "expiresAt")
                    ? `Closes ${formatDate(getRecordString(item, "expiresAt"))}`
                    : "No closing date"}
                </p>
              </div>
              <div>
                <Chip className="rounded-md" size="sm" variant="secondary">
                  {statusLabel(item.status)}
                </Chip>
              </div>
              <div className="grid grid-cols-5 gap-3 text-xs lg:contents">
                {[
                  ["Applications", "applications"],
                  ["CV review", "underReview"],
                  ["Interviewing", "interviewing"],
                  ["Hired", "hired"],
                  ["Rejected", "rejected"],
                ].map(([label, key]) => (
                  <span
                    key={key}
                    className="flex items-center justify-between gap-2 lg:block lg:text-left"
                  >
                    <span className="text-default-500 lg:hidden">{label}</span>
                    <strong className="text-sm font-semibold tabular-nums text-foreground">
                      {getRecordNumber(item, key)}
                    </strong>
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider bg-content1 px-3 py-2">
          <p className="text-xs text-default-500">
            Showing {firstVisibleItem}-{lastVisibleItem} of {data.length}{" "}
            postings
          </p>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              aria-label="Previous page"
              size="sm"
              variant="secondary"
              className="h-8 w-8 rounded-lg"
              isDisabled={currentPage === 1}
              onPress={() =>
                setPage((previousPage) => Math.max(1, previousPage - 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-default-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              isIconOnly
              aria-label="Next page"
              size="sm"
              variant="secondary"
              className="h-8 w-8 rounded-lg"
              isDisabled={currentPage === totalPages}
              onPress={() =>
                setPage((previousPage) =>
                  Math.min(totalPages, previousPage + 1),
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
