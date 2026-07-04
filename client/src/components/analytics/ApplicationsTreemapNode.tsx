import { chartColors } from "../../lib/analytics-utils";

type TreemapNodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  depth?: number;
  index?: number;
};

export const ApplicationsTreemapNode = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  value,
  depth = 0,
  index = 0,
}: TreemapNodeProps) => {
  if (depth === 0) {
    return null;
  }

  const fill = chartColors[index % chartColors.length];
  const clipId = `applications-tile-${index}-${Math.round(x)}-${Math.round(y)}`;
  const canShowName = width > 88 && height > 42;
  const canShowValue = width > 78 && height > 62;
  const canShowCompactValue = !canShowValue && width > 56 && height > 36;

  return (
    <g>
      <clipPath id={clipId}>
        <rect
          x={x + 8}
          y={y + 8}
          width={Math.max(width - 16, 0)}
          height={Math.max(height - 16, 0)}
          rx={8}
          ry={8}
        />
      </clipPath>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={4}
      />
      <g clipPath={`url(#${clipId})`}>
        {canShowName && (
          <text
            x={x + 14}
            y={y + 24}
            fill="#ffffff"
            fontSize={14}
            fontWeight={600}
          >
            {name}
          </text>
        )}
        {canShowValue && (
          <text
            x={x + 14}
            y={canShowName ? y + 46 : y + 24}
            fill="rgba(255,255,255,0.86)"
            fontSize={12}
            fontWeight={500}
          >
            {value} applications
          </text>
        )}
        {canShowCompactValue && (
          <text
            x={x + 12}
            y={y + 25}
            fill="#ffffff"
            fontSize={13}
            fontWeight={700}
          >
            {value}
          </text>
        )}
      </g>
    </g>
  );
};
