import { DbClient, getDbClient } from './db-client.ts';
import { getRedisClient, RedisClient } from './redis-client.ts';
import { container } from 'tsyringe';
import { TOKENS } from './dependency-tokens.ts';
import { JobPostingService } from '../services/job-posting.service.ts';
import { JobPostingController } from '../controllers/job-posting.controller.ts';
import { JobPostingRepository } from '../data/repositories/job-posting.repository.ts';

import { JobApplicationController } from '../controllers/job-application.controller.ts';
import { JobApplicationService } from '../services/job-application.service.ts';
import { JobApplicationRepository } from '../data/repositories/job-application.repository.ts';
import { CompanyController } from '../controllers/company.controller.ts';
import { CompanyService } from '../services/company.service.ts';
import { CompanyRepository } from '../data/repositories/company.repository.ts';

export const registerDependencies = async () => {
  const dbClient = getDbClient();
  const redisClient = getRedisClient();

  container.registerInstance<DbClient>(TOKENS.db, dbClient);
  container.registerInstance<RedisClient>(TOKENS.redis, redisClient);

  container.register<JobPostingController>(TOKENS.jobPostingController, { useClass: JobPostingController });
  container.register<JobPostingService>(TOKENS.jobPostingService, { useClass: JobPostingService });
  container.register<JobPostingRepository>(TOKENS.jobPostingRepository, { useClass: JobPostingRepository });

  container.register<JobApplicationController>(TOKENS.jobApplicationController, { useClass: JobApplicationController });
  container.register<JobApplicationService>(TOKENS.jobApplicationService, { useClass: JobApplicationService });
  container.register<JobApplicationRepository>(TOKENS.jobApplicationRepository, { useClass: JobApplicationRepository });

  container.register<CompanyController>(TOKENS.companyController, { useClass: CompanyController });
  container.register<CompanyService>(TOKENS.companyService, { useClass: CompanyService });
  container.register<CompanyRepository>(TOKENS.companyRepository, { useClass: CompanyRepository });
};
