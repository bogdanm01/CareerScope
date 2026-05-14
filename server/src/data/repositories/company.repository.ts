import { GenericRepository } from './generic.repository.ts';
import { Company, CompanyInsert } from '../schema/company.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';
import { company } from '../schema/company.schema.ts';

@injectable()
export class CompanyRepository extends GenericRepository<Company, CompanyInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, company);
  }
}
