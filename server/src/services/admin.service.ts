import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { CompanyRepository, type AdminCompanyListItem } from '../data/repositories/company.repository.ts';
import { PaginatedResult } from '../lib/api-response.ts';
import { AdminCompanyListRequestSchema } from '../lib/zod/admin-company.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';

@injectable()
export class AdminService {
  constructor(@inject(TOKENS.companyRepository) private companyRepository: CompanyRepository) {}

  async getCompanies(payload: unknown): Promise<PaginatedResult<AdminCompanyListItem>> {
    const validationResult = AdminCompanyListRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const query = validationResult.data;
    const result = await this.companyRepository.findAdminCompanies(
      {
        search: query.search,
        approvalStatus: query.approvalStatus,
        isApproved: query.isApproved,
        isDeleted: query.isDeleted,
        orderBy: query.orderBy,
        sort: query.sort,
      },
      {
        page: query.page,
        pageSize: query.limit,
      },
    );

    return {
      data: result.data,
      pagination: {
        currentPage: query.page,
        pageSize: query.limit,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.limit),
      },
    };
  }
}
