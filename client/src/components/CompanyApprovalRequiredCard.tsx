import { Card } from '@heroui/react';
import { Building2 } from 'lucide-react';
import type { RecruiterCompanyProfile } from '../lib/me-api';

type CompanyApprovalRequiredCardProps = {
  area: 'analytics' | 'postings' | 'applications';
  company: RecruiterCompanyProfile | null;
  verificationError?: string | null;
};

const areaLabels = {
  analytics: 'Company analytics',
  postings: 'Company postings',
  applications: 'Company applications',
} as const;

export const CompanyApprovalRequiredCard = ({
  area,
  company,
  verificationError,
}: CompanyApprovalRequiredCardProps) => {
  const areaLabel = areaLabels[area];
  const description = verificationError
    ? 'We could not verify your company approval. Refresh the page and try again.'
    : company?.approvalStatus === 'Rejected'
      ? `Your company registration was rejected. Update the company profile and obtain admin approval to access ${area}.`
      : `${areaLabel} will become available after an admin approves your company.`;

  return (
    <Card className="rounded-xl border border-divider bg-content1 shadow-none">
      <Card.Content className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-content2 text-foreground">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-medium text-foreground">{areaLabel} are not available yet</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-default-600">{description}</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};
