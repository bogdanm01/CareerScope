import { Avatar } from "@heroui/react";
import { getCompanyLogoUrl } from "../lib/company-logo";

type CompanySelectOptionProps = {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  iconOnly?: boolean;
};

export const CompanySelectOption = ({
  name,
  logoUrl,
  websiteUrl,
  iconOnly = false,
}: CompanySelectOptionProps) => {
  const resolvedLogoUrl = getCompanyLogoUrl(logoUrl, websiteUrl);

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="h-5 w-5 shrink-0 overflow-hidden rounded-md border border-divider bg-content2">
        {resolvedLogoUrl && (
          <Avatar.Image
            alt=""
            className="h-full w-full bg-white object-contain p-0.5"
            src={resolvedLogoUrl}
          />
        )}
        <Avatar.Fallback
          className="flex h-full w-full items-center justify-center bg-content2 text-[10px] font-semibold text-foreground"
          delayMs={0}
        >
          {name.trim().charAt(0).toUpperCase() || "?"}
        </Avatar.Fallback>
      </Avatar>
      {!iconOnly && <span className="truncate">{name}</span>}
    </span>
  );
};
