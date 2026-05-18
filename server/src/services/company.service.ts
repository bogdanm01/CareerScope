import { TOKENS } from '../config/dependency-tokens.ts';
import { inject, injectable } from 'tsyringe';
import { CompanyRepository } from '../data/repositories/company.repository.ts';
import { company, Company } from '../data/schema/company.schema.ts';
import { SingleResult } from '../lib/api-response.ts';
import { IntegerIdSchema } from '../lib/zod/integer-id.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { and, eq } from 'drizzle-orm';
import { NotFoundError } from '../lib/app-error.ts';

export type PublicCompany = Omit<Company, 'taxId' | 'isApproved' | 'approvedAt' | 'isDeleted'>;

@injectable()
export class CompanyService {
  constructor(@inject(TOKENS.companyRepository) private companyRepository: CompanyRepository) {}

  async getCompany(companyId: unknown): Promise<SingleResult<PublicCompany>> {
    const idValidationResult = IntegerIdSchema.safeParse({ id: companyId });

    if (!idValidationResult.success) {
      throw new ZodValidationError(idValidationResult.error);
    }

    const validCompanyId = idValidationResult.data.id;

    const result = await this.companyRepository.findOne(
      validCompanyId,
      {
        id: company.id,
        name: company.name,
        shortDescription: company.shortDescription,
        description: company.description,
        foundingYear: company.foundingYear,
        numberOfEmployees: company.numberOfEmployees,
        address: company.address,
        logoUrl: company.logoUrl,
        websiteUrl: company.websiteUrl,
      },
      and(eq(company.isApproved, true), eq(company.isDeleted, false)),
    );

    if (!result) {
      throw new NotFoundError('Company not found.');
    }

    return {
      data: result as PublicCompany,
    };
  }
}
