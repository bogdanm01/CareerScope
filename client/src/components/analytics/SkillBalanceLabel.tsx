import { formatSignedNumber } from "../../lib/analytics-utils";

type SkillBalanceLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
};

export const SkillBalanceLabel = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value = 0,
}: SkillBalanceLabelProps) => {
  const numericValue = Number(value);
  const leftEdge = Math.min(x, x + width);
  const rightEdge = Math.max(x, x + width);
  const labelX =
    numericValue > 0
      ? rightEdge + 8
      : numericValue < 0
        ? leftEdge - 8
        : rightEdge + 8;
  const fill = numericValue < 0
    ? "var(--chart-negative)"
    : numericValue > 0
      ? "var(--chart-positive)"
      : "var(--chart-neutral)";

  return (
    <text
      x={labelX}
      y={y + height / 2}
      dy={4}
      textAnchor={numericValue < 0 ? "end" : "start"}
      fill={fill}
      fontSize={12}
      fontWeight={600}
    >
      {formatSignedNumber(numericValue)}
    </text>
  );
};
