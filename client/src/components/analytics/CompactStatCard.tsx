import { Card } from "@heroui/react";
import type { AnalyticsStat } from "../../lib/analytics-api";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDot,
  ShieldCheck,
  TrendingUp,
  ClipboardCheck,
} from "lucide-react";

const statIconMap: Record<
  string,
  { icon: typeof ClipboardCheck; className: string }
> = {
  applications: { icon: ClipboardCheck, className: "bg-[#aa2d00] text-white" },
  underReview: { icon: CircleDot, className: "bg-status-warning" },
  interviewing: { icon: CircleDot, className: "bg-brand text-brand-foreground" },
  hired: { icon: CheckCircle2, className: "bg-status-success" },
  rejected: { icon: CircleDot, className: "status-danger" },
  selectedSkills: { icon: BarChart3, className: "bg-content2 text-foreground" },
  cvUploaded: { icon: ShieldCheck, className: "bg-status-success" },
  profileCompleted: {
    icon: CheckCircle2,
    className: "bg-status-success",
  },
  postings: { icon: BriefcaseBusiness, className: "bg-[#181d26] text-white" },
  activePostings: {
    icon: BriefcaseBusiness,
    className: "bg-status-success-solid",
  },
  pendingPostings: {
    icon: ClipboardCheck,
    className: "bg-status-warning",
  },
  companies: { icon: Building2, className: "bg-[#181d26] text-white" },
  pendingCompanies: {
    icon: Building2,
    className: "bg-status-warning",
  },
  approvedCompanies: {
    icon: ShieldCheck,
    className: "bg-status-success",
  },
};

const getStatDisplayValue = (stat: AnalyticsStat) => {
  if (stat.key === "cvUploaded" || stat.key === "profileCompleted") {
    return stat.value > 0 ? "Yes" : "No";
  }

  return stat.value;
};

export const CompactStatCard = ({ stat }: { stat: AnalyticsStat }) => {
  const iconConfig = statIconMap[stat.key] ?? {
    icon: TrendingUp,
    className: "bg-content2 text-foreground",
  };
  const StatIcon = iconConfig.icon;

  return (
    <Card className="rounded-xl border border-divider shadow-none">
      <Card.Content className="!flex min-h-[72px] !flex-row !items-center !justify-start gap-3 px-3.5 py-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconConfig.className}`}
        >
          <StatIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <span className="block truncate text-xs font-medium text-default-500">
            {stat.label}
          </span>
          <strong className="mt-1 block text-2xl font-medium leading-none tracking-[-0.02em] text-foreground">
            {getStatDisplayValue(stat)}
          </strong>
        </div>
      </Card.Content>
    </Card>
  );
};
