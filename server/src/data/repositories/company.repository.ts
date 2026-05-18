import { GenericRepository } from './generic.repository.ts';
import { Company, CompanyInsert } from '../schema/company.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { company } from '../schema/company.schema.ts';
import { and, count, eq } from 'drizzle-orm';
import { user } from '../schema/auth.schema.ts';
import { COMPANY_APPROVAL_STATUS, ONBOARDING_STATUS, USER_ROLE } from '../util/constants.ts';

export type PendingRecruiterOnboardingRequest = {
  company: {
    id: number;
    name: string;
    taxId: string;
    shortDescription: string | null;
    description: string | null;
    foundingYear: number | null;
    numberOfEmployees: number | null;
    address: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    approvalStatus: string;
  };
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string | null;
  };
};

export type ApprovedRecruiterOnboardingRequest = {
  company: {
    id: number;
    name: string;
    isApproved: boolean;
    approvalStatus: string;
    approvedAt: Date | null;
  };
  recruiter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    onboardingStatus: string;
  };
};

export type RejectedRecruiterOnboardingRequest = {
  company: {
    id: number;
    name: string;
    isApproved: boolean;
    approvalStatus: string;
    approvalRejectionReason: string | null;
  };
  recruiter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    onboardingStatus: string;
  };
};

type FindPendingRecruiterOnboardingPagination = {
  page?: number;
  pageSize?: number;
};

@injectable()
export class CompanyRepository extends GenericRepository<Company, CompanyInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, company);
  }

  async findByTaxId(taxId: string) {
    const [record] = await this.db.select({ id: company.id }).from(company).where(eq(company.taxId, taxId)).limit(1);
    return record ?? null;
  }

  async findApprovalStatus(id: number) {
    const [record] = await this.db
      .select({ id: company.id, isApproved: company.isApproved })
      .from(company)
      .where(eq(company.id, id))
      .limit(1);

    return record ?? null;
  }

  async findPendingRecruiterOnboardingRequests(
    pagination: FindPendingRecruiterOnboardingPagination = {},
  ): Promise<{ data: PendingRecruiterOnboardingRequest[]; totalItems: number }> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 50;
    const offset = (page - 1) * pageSize;
    const filters = and(
      eq(company.approvalStatus, COMPANY_APPROVAL_STATUS.PENDING_APPROVAL),
      eq(company.isDeleted, false),
      eq(user.role, USER_ROLE.RECRUITER),
      eq(user.isDeleted, false),
    );

    const recordsQuery = this.db
      .select({
        companyId: company.id,
        companyName: company.name,
        companyTaxId: company.taxId,
        companyShortDescription: company.shortDescription,
        companyDescription: company.description,
        companyFoundingYear: company.foundingYear,
        companyNumberOfEmployees: company.numberOfEmployees,
        companyAddress: company.address,
        companyLogoUrl: company.logoUrl,
        companyWebsiteUrl: company.websiteUrl,
        companyApprovalStatus: company.approvalStatus,
        recruiterId: user.id,
        recruiterFirstName: user.firstName,
        recruiterLastName: user.lastName,
        recruiterEmail: user.email,
        recruiterImage: user.image,
      })
      .from(company)
      .innerJoin(user, eq(user.companyId, company.id))
      .where(filters)
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ totalItems: count() })
      .from(company)
      .innerJoin(user, eq(user.companyId, company.id))
      .where(filters);

    const [records, [countResult]] = await Promise.all([recordsQuery, countQuery]);

    return {
      data: records.map((record) => ({
        company: {
          id: record.companyId,
          name: record.companyName,
          taxId: record.companyTaxId,
          shortDescription: record.companyShortDescription,
          description: record.companyDescription,
          foundingYear: record.companyFoundingYear,
          numberOfEmployees: record.companyNumberOfEmployees,
          address: record.companyAddress,
          logoUrl: record.companyLogoUrl,
          websiteUrl: record.companyWebsiteUrl,
          approvalStatus: record.companyApprovalStatus,
        },
        recruiter: {
          id: record.recruiterId,
          firstName: record.recruiterFirstName,
          lastName: record.recruiterLastName,
          email: record.recruiterEmail,
          image: record.recruiterImage,
        },
      })),
      totalItems: countResult?.totalItems ?? 0,
    };
  }

  async approveRecruiterOnboarding(companyId: number): Promise<ApprovedRecruiterOnboardingRequest | null> {
    return await this.db.transaction(async (tx) => {
      const [pendingRequest] = await tx
        .select({
          companyId: company.id,
          companyName: company.name,
          recruiterId: user.id,
        })
        .from(company)
        .innerJoin(user, eq(user.companyId, company.id))
        .where(
          and(
            eq(company.id, companyId),
            eq(company.approvalStatus, COMPANY_APPROVAL_STATUS.PENDING_APPROVAL),
            eq(company.isDeleted, false),
            eq(user.role, USER_ROLE.RECRUITER),
            eq(user.isDeleted, false),
          ),
        )
        .limit(1);

      if (!pendingRequest) {
        return null;
      }

      const [approvedCompany] = await tx
        .update(company)
        .set({
          isApproved: true,
          approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
          approvalRejectionReason: null,
          approvedAt: new Date(),
        })
        .where(eq(company.id, pendingRequest.companyId))
        .returning({
          id: company.id,
          name: company.name,
          isApproved: company.isApproved,
          approvalStatus: company.approvalStatus,
          approvedAt: company.approvedAt,
        });

      const [updatedRecruiter] = await tx
        .update(user)
        .set({ onboardingStatus: ONBOARDING_STATUS.COMPLETED })
        .where(eq(user.id, pendingRequest.recruiterId))
        .returning({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          onboardingStatus: user.onboardingStatus,
        });

      if (!approvedCompany || !updatedRecruiter) {
        throw new Error('Failed to approve recruiter onboarding request.');
      }

      return {
        company: approvedCompany,
        recruiter: updatedRecruiter,
      };
    });
  }

  async rejectRecruiterOnboarding(
    companyId: number,
    reason: string,
  ): Promise<RejectedRecruiterOnboardingRequest | null> {
    return await this.db.transaction(async (tx) => {
      const [pendingRequest] = await tx
        .select({
          companyId: company.id,
          recruiterId: user.id,
        })
        .from(company)
        .innerJoin(user, eq(user.companyId, company.id))
        .where(
          and(
            eq(company.id, companyId),
            eq(company.approvalStatus, COMPANY_APPROVAL_STATUS.PENDING_APPROVAL),
            eq(company.isDeleted, false),
            eq(user.role, USER_ROLE.RECRUITER),
            eq(user.isDeleted, false),
          ),
        )
        .limit(1);

      if (!pendingRequest) {
        return null;
      }

      const [rejectedCompany] = await tx
        .update(company)
        .set({
          isApproved: false,
          approvalStatus: COMPANY_APPROVAL_STATUS.REJECTED,
          approvalRejectionReason: reason,
          approvedAt: null,
        })
        .where(eq(company.id, pendingRequest.companyId))
        .returning({
          id: company.id,
          name: company.name,
          isApproved: company.isApproved,
          approvalStatus: company.approvalStatus,
          approvalRejectionReason: company.approvalRejectionReason,
        });

      const [updatedRecruiter] = await tx
        .update(user)
        .set({ onboardingStatus: ONBOARDING_STATUS.COMPANY_REJECTED })
        .where(eq(user.id, pendingRequest.recruiterId))
        .returning({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          onboardingStatus: user.onboardingStatus,
        });

      if (!rejectedCompany || !updatedRecruiter) {
        throw new Error('Failed to reject recruiter onboarding request.');
      }

      return {
        company: rejectedCompany,
        recruiter: updatedRecruiter,
      };
    });
  }
}
