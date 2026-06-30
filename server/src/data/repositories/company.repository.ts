import { GenericRepository } from './generic.repository.ts';
import { Company, CompanyInsert } from '../schema/company.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { company } from '../schema/company.schema.ts';
import { and, asc, count, desc, eq, ilike, or, SQL, sql } from 'drizzle-orm';
import { user } from '../schema/auth.schema.ts';
import { COMPANY_APPROVAL_STATUS, ONBOARDING_STATUS, USER_ROLE } from '../util/constants.ts';
import { applicationReview } from '../schema/application-review.schema.ts';
import { jobApplication } from '../schema/job-application.schema.ts';
import type { AdminCompanyListRequest } from '../../lib/zod/admin-company.zod-schema.ts';

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

type FindCompanyReviewsPagination = {
  page?: number;
  pageSize?: number;
};

type FindAdminCompaniesFilters = Pick<
  AdminCompanyListRequest,
  'search' | 'approvalStatus' | 'isApproved' | 'isDeleted' | 'sort' | 'orderBy'
>;

type FindAdminCompaniesPagination = {
  page?: number;
  pageSize?: number;
};

export type AdminCompanyListItem = {
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
  isApproved: boolean;
  approvalStatus: string;
  approvalRejectionReason: string | null;
  approvedAt: Date | null;
  isDeleted: boolean;
};

export type CompanyReviewListItem = {
  id: number;
  rating: number;
  comment: string;
  createdAt: Date | null;
  candidate: {
    id: string;
    name: string;
    image: string | null;
  };
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

  async findAdminCompanies(
    filters: FindAdminCompaniesFilters,
    pagination: FindAdminCompaniesPagination = {},
  ): Promise<{ data: AdminCompanyListItem[]; totalItems: number }> {
    const { page = 1, pageSize = 50 } = pagination;
    const { search, approvalStatus, isApproved, isDeleted, orderBy = 'id', sort = 'desc' } = filters;
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];

    if (typeof isDeleted === 'boolean') {
      conditions.push(eq(company.isDeleted, isDeleted));
    }

    if (typeof isApproved === 'boolean') {
      conditions.push(eq(company.isApproved, isApproved));
    }

    if (approvalStatus) {
      conditions.push(eq(company.approvalStatus, approvalStatus));
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(or(
        ilike(company.name, pattern),
        ilike(company.taxId, pattern),
        ilike(company.shortDescription, pattern),
      ) as SQL);
    }

    let recordsQuery = this.db
      .select({
        id: company.id,
        name: company.name,
        taxId: company.taxId,
        shortDescription: company.shortDescription,
        description: company.description,
        foundingYear: company.foundingYear,
        numberOfEmployees: company.numberOfEmployees,
        address: company.address,
        logoUrl: company.logoUrl,
        websiteUrl: company.websiteUrl,
        isApproved: company.isApproved,
        approvalStatus: company.approvalStatus,
        approvalRejectionReason: company.approvalRejectionReason,
        approvedAt: company.approvedAt,
        isDeleted: company.isDeleted,
      })
      .from(company)
      .$dynamic();

    let countQuery = this.db.select({ totalItems: count() }).from(company).$dynamic();

    if (conditions.length > 0) {
      recordsQuery = recordsQuery.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    if (sort === 'asc') {
      recordsQuery = recordsQuery.orderBy(asc(company[orderBy]));
    } else {
      recordsQuery = recordsQuery.orderBy(desc(company[orderBy]));
    }

    recordsQuery = recordsQuery.limit(pageSize).offset(offset);

    const [records, [countResult]] = await Promise.all([recordsQuery, countQuery]);

    return {
      data: records,
      totalItems: countResult?.totalItems ?? 0,
    };
  }

  async findCompanyReviews(
    companyId: number,
    pagination: FindCompanyReviewsPagination = {},
  ): Promise<{ data: CompanyReviewListItem[]; totalItems: number }> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const filters = and(
      eq(applicationReview.companyId, companyId),
      eq(applicationReview.isDeleted, false),
      eq(company.isDeleted, false),
      eq(company.isApproved, true),
      eq(user.isDeleted, false),
    );

    const recordsQuery = this.db
      .select({
        id: applicationReview.id,
        rating: applicationReview.rating,
        comment: applicationReview.comment,
        createdAt: applicationReview.createdAt,
        candidateId: user.id,
        candidateName: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
        candidateImage: user.image,
      })
      .from(applicationReview)
      .innerJoin(company, eq(applicationReview.companyId, company.id))
      .innerJoin(jobApplication, eq(applicationReview.jobApplicationId, jobApplication.id))
      .innerJoin(user, eq(jobApplication.userId, user.id))
      .where(filters)
      .orderBy(desc(applicationReview.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ totalItems: count() })
      .from(applicationReview)
      .innerJoin(company, eq(applicationReview.companyId, company.id))
      .innerJoin(jobApplication, eq(applicationReview.jobApplicationId, jobApplication.id))
      .innerJoin(user, eq(jobApplication.userId, user.id))
      .where(filters);

    const [records, [countResult]] = await Promise.all([recordsQuery, countQuery]);

    return {
      data: records.map((record) => ({
        id: record.id,
        rating: record.rating,
        comment: record.comment,
        createdAt: record.createdAt,
        candidate: {
          id: record.candidateId,
          name: record.candidateName,
          image: record.candidateImage,
        },
      })),
      totalItems: countResult?.totalItems ?? 0,
    };
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
