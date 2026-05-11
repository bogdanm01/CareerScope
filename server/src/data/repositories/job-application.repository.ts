import { GenericRepository } from './generic.repository.ts';
import { jobApplication, JobApplication, JobApplicationInsert } from '../schema/job-application.schema.ts';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { DbClient } from '../../config/db-client.ts';

@injectable()
export class JobApplicationRepository extends GenericRepository<JobApplication, JobApplicationInsert, number> {
  constructor(@inject(TOKENS.db) db: DbClient) {
    super(db, jobApplication);
  }
}
