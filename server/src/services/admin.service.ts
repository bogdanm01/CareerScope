import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { CompanyRepository, type AdminCompanyListItem } from '../data/repositories/company.repository.ts';
import { PaginatedResult } from '../lib/api-response.ts';
import { AdminCompanyListRequestSchema } from '../lib/zod/admin-company.zod-schema.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { NotFoundError } from '../lib/app-error.ts';
import { ConflictError, ForbiddenError } from '../lib/app-error.ts';
import { UserRepository, type AdminUserListItem } from '../data/repositories/user.repository.ts';
import { AdminUserIdSchema, AdminUserListRequestSchema, AdminUserStatusUpdateSchema, AdminUserUpdateSchema } from '../lib/zod/admin-user.zod-schema.ts';

@injectable()
export class AdminService {
  constructor(
    @inject(TOKENS.companyRepository) private companyRepository: CompanyRepository,
    @inject(TOKENS.userRepository) private userRepository: UserRepository,
  ) {}

  async getUsers(payload: unknown): Promise<PaginatedResult<AdminUserListItem>> {
    const validation = AdminUserListRequestSchema.safeParse(payload);
    if (!validation.success) throw new ZodValidationError(validation.error);
    const query = validation.data;
    const result = await this.userRepository.findAdminUsers(query);
    return { data: result.data, pagination: { currentPage: query.page, pageSize: query.limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / query.limit) } };
  }

  async getUser(userId: unknown) {
    const validation = AdminUserIdSchema.safeParse({ id: userId });
    if (!validation.success) throw new ZodValidationError(validation.error);
    const record = await this.userRepository.findAdminUserById(validation.data.id);
    if (!record) throw new NotFoundError('User not found.');
    return { data: record };
  }

  async updateUser(userId: unknown, payload: unknown) {
    const id = AdminUserIdSchema.safeParse({ id: userId });
    const body = AdminUserUpdateSchema.safeParse(payload);
    if (!id.success) throw new ZodValidationError(id.error);
    if (!body.success) throw new ZodValidationError(body.error);
    if (await this.userRepository.findOtherByEmail(body.data.email, id.data.id)) throw new ConflictError('A user with this email already exists.');
    if (!await this.userRepository.updateAdminUser(id.data.id, body.data)) throw new NotFoundError('User not found.');
    return this.getUser(id.data.id);
  }

  async updateUserStatus(actorId: string, userId: unknown, payload: unknown) {
    const id = AdminUserIdSchema.safeParse({ id: userId });
    const body = AdminUserStatusUpdateSchema.safeParse(payload);
    if (!id.success) throw new ZodValidationError(id.error);
    if (!body.success) throw new ZodValidationError(body.error);
    if (actorId === id.data.id && body.data.status === 'Disabled') throw new ForbiddenError('You cannot disable your own account.');
    if (!await this.userRepository.updateAdminUserStatus(id.data.id, body.data.status === 'Disabled')) throw new NotFoundError('User not found.');
    return this.getUser(id.data.id);
  }

  async getCompany(companyId: unknown) {
    const idValidationResult = IntegerIdSchema.safeParse({ id: companyId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const result = await this.companyRepository.findAdminCompanyById(idValidationResult.data.id);

    if (!result) {
      throw new NotFoundError('Company not found.');
    }

    return {
      data: result,
    };
  }

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
