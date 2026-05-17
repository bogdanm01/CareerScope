import { GenericRepository } from './generic.repository.ts';
import { Company, CompanyInsert } from '../schema/company.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { company } from '../schema/company.schema.ts';
import { eq } from 'drizzle-orm';

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
}
