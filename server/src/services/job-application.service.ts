import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { JobApplicationRepository } from '../data/repositories/job-application.repository.ts';

@injectable()
export class JobApplicationService {
  constructor(@inject(TOKENS.jobApplicationRepository) private jobApplicationRepository: JobApplicationRepository) {}
}
