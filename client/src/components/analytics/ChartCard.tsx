import { Card } from "@heroui/react";
import type { LucideIcon } from "lucide-react";

export const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  childrenClassName = "mt-4",
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  childrenClassName?: string;
  children: React.ReactNode;
}) => (
  <Card className="h-full rounded-xl border border-divider bg-content1 shadow-none">
    <Card.Content className="p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium tracking-[-0.01em] text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm leading-6 text-default-500">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-divider bg-content2 text-foreground-500">
            <Icon
              aria-hidden="true"
              className="h-4.5 w-4.5"
              strokeWidth={1.7}
            />
          </span>
        )}
      </div>
      <div className={childrenClassName}>{children}</div>
    </Card.Content>
  </Card>
);
