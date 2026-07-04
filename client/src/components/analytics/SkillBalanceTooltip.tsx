import { formatSignedNumber } from "../../lib/analytics-utils";

type SkillBalanceTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: {
      skill?: string;
      demand?: number;
      supply?: number;
      supplyBalance?: number;
    };
  }>;
};

export const SkillBalanceTooltip = ({
  active,
  payload,
}: SkillBalanceTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;
  const balance = Number(item?.supplyBalance ?? 0);
  const absBalance = Math.abs(balance);
  const explanation =
    balance < 0
      ? `Demand exceeds candidate supply by ${absBalance}.`
      : balance > 0
        ? `Candidate supply exceeds demand by ${absBalance}.`
        : "Candidate supply and job demand are balanced.";

  return (
    <div className="min-w-60 rounded-xl border border-divider bg-content1 px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">
        {item?.skill ?? "Skill"}
      </p>
      <div className="mt-2 grid gap-1 text-sm text-default-500">
        <div className="flex justify-between gap-4">
          <span>Candidate count</span>
          <strong className="font-semibold tabular-nums text-foreground">
            {item?.supply ?? 0}
          </strong>
        </div>
        <div className="flex justify-between gap-4">
          <span>Job posting count</span>
          <strong className="font-semibold tabular-nums text-foreground">
            {item?.demand ?? 0}
          </strong>
        </div>
        <div className="flex justify-between gap-4">
          <span>Supply Balance</span>
          <strong className="font-semibold tabular-nums text-foreground">
            {formatSignedNumber(balance)}
          </strong>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-default-500">{explanation}</p>
    </div>
  );
};
