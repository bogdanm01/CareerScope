import { inject, injectable } from 'tsyringe';
import { APIError } from 'better-auth';
import {
  PendingRecruiterOnboardingListRequestSchema,
  RecruiterOnboardingRequest,
  RecruiterOnboardingRequestSchema,
} from '../lib/zod/onboarding.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { PaginatedResult, SingleResult } from '../lib/api-response.ts';
import {
  ApprovedRecruiterOnboardingRequest,
  CompanyRepository,
  PendingRecruiterOnboardingRequest,
  RejectedRecruiterOnboardingRequest,
} from '../data/repositories/company.repository.ts';
import { UserRepository } from '../data/repositories/user.repository.ts';
import { TOKENS } from '../config/dependency-tokens.ts';
import { COMPANY_APPROVAL_STATUS, ONBOARDING_STATUS, USER_ROLE } from '../data/util/constants.ts';
import { auth } from '../config/auth.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/app-error.ts';
import { Company } from '../data/schema/company.schema.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { RejectRecruiterOnboardingRequestSchema } from '../lib/zod/onboarding.zod-schema.ts';

type RecruiterOnboardingResponse = {
  recruiter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    onboardingStatus: string;
  };
  company: {
    id: number;
    name: string;
    isApproved: boolean;
  };
};

@injectable()
export class OnboardingService {
  constructor(
    @inject(TOKENS.companyRepository) private companyRepository: CompanyRepository,
    @inject(TOKENS.userRepository) private userRepository: UserRepository,
  ) {}

  async registerRecruiter(payload: unknown): Promise<SingleResult<RecruiterOnboardingResponse>> {
    const validationResult = RecruiterOnboardingRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const request = validationResult.data;
    const normalizedEmail = request.recruiter.email.toLowerCase();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictError('A user with this email already exists.');
    }

    const existingCompany = await this.companyRepository.findByTaxId(request.company.taxId);

    if (existingCompany) {
      throw new ConflictError('A company with this tax id already exists.');
    }

    let company: Company | undefined;
    let createdUserId: string | undefined;

    try {
      company = await this.companyRepository.insert({
        name: request.company.name,
        taxId: request.company.taxId,
        shortDescription: request.company.shortDescription,
        description: request.company.description,
        foundingYear: request.company.foundingYear,
        numberOfEmployees: request.company.numberOfEmployees,
        address: request.company.address,
        logoUrl: request.company.logoUrl,
        websiteUrl: request.company.websiteUrl,
        isApproved: false,
        approvalStatus: COMPANY_APPROVAL_STATUS.PENDING_APPROVAL,
      });

      const signUpResult = await this.signUpRecruiter(request, normalizedEmail);
      createdUserId = signUpResult.user.id;

      const recruiter = await this.userRepository.updateRecruiterOnboarding(createdUserId, {
        role: USER_ROLE.RECRUITER,
        companyId: company.id,
        onboardingStatus: ONBOARDING_STATUS.COMPANY_PENDING_APPROVAL,
      });

      if (!recruiter) {
        throw new Error('Failed to update recruiter onboarding data.');
      }

      return {
        data: {
          recruiter: {
            id: recruiter.id,
            email: recruiter.email,
            firstName: recruiter.firstName,
            lastName: recruiter.lastName,
            role: recruiter.role,
            onboardingStatus: recruiter.onboardingStatus,
          },
          company: {
            id: company.id,
            name: company.name,
            isApproved: company.isApproved,
          },
        },
      };
    } catch (error) {
      await this.cleanupFailedRecruiterOnboarding(company?.id, createdUserId);
      throw error;
    }
  }

  async getPendingRecruiterOnboardingRequests(
    payload: unknown,
  ): Promise<PaginatedResult<PendingRecruiterOnboardingRequest>> {
    const validationResult = PendingRecruiterOnboardingListRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const query = validationResult.data;
    const result = await this.companyRepository.findPendingRecruiterOnboardingRequests({
      page: query.page,
      pageSize: query.limit,
    });

    return {
      data: result.data,
      pagination: {
        currentPage: query.page,
        pageSize: query.limit,
        totalPages: Math.ceil(result.totalItems / query.limit),
        totalItems: result.totalItems,
      },
    };
  }

  async approveRecruiterOnboarding(companyId: unknown): Promise<SingleResult<ApprovedRecruiterOnboardingRequest>> {
    const validationResult = IntegerIdSchema.safeParse({ id: companyId });

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const approvedRequest = await this.companyRepository.approveRecruiterOnboarding(validationResult.data.id);

    if (!approvedRequest) {
      throw new NotFoundError('No pending recruiter onboarding request found for provided company id.');
    }

    return {
      data: approvedRequest,
    };
  }

  async rejectRecruiterOnboarding(
    companyId: unknown,
    payload: unknown,
  ): Promise<SingleResult<RejectedRecruiterOnboardingRequest>> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: companyId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const bodyValidationResult = RejectRecruiterOnboardingRequestSchema.safeParse(payload);

    if (!bodyValidationResult.success) {
      throw new ZodValidationError(bodyValidationResult.error);
    }

    const rejectedRequest = await this.companyRepository.rejectRecruiterOnboarding(
      idValidationResult.data.id,
      bodyValidationResult.data.reason,
    );

    if (!rejectedRequest) {
      throw new NotFoundError('No pending recruiter onboarding request found for provided company id.');
    }

    return {
      data: rejectedRequest,
    };
  }

  private async signUpRecruiter(request: RecruiterOnboardingRequest, email: string) {
    try {
      return await auth.api.signUpEmail({
        body: {
          name: `${request.recruiter.firstName} ${request.recruiter.lastName}`,
          email,
          password: request.recruiter.password,
          firstName: request.recruiter.firstName,
          lastName: request.recruiter.lastName,
          dateOfBirth: request.recruiter.dateOfBirth,
        },
      });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 422) {
        throw new ConflictError('A user with this email already exists.');
      }

      if (error instanceof APIError && error.statusCode >= 400 && error.statusCode < 500) {
        throw new BadRequestError(error.message);
      }

      throw error;
    }
  }

  private async cleanupFailedRecruiterOnboarding(companyId?: number, userId?: string) {
    const cleanupTasks: Promise<unknown>[] = [];

    if (userId) {
      cleanupTasks.push(this.userRepository.softDelete(userId));
    }

    if (companyId) {
      cleanupTasks.push(this.companyRepository.softDelete(companyId));
    }

    await Promise.allSettled(cleanupTasks);
  }
}
