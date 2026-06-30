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
import { MeController } from '../controllers/me.controller.ts';
import { MeService } from '../services/me.service.ts';
import { UserRepository } from '../data/repositories/user.repository.ts';
import { SkillRepository } from '../data/repositories/skill.repository.ts';
import { OnboardingController } from '../controllers/onboarding.controller.ts';
import { OnboardingService } from '../services/onboarding.service.ts';
import { SkillController } from '../controllers/skill.controller.ts';
import { SkillService } from '../services/skill.service.ts';
import { AdminController } from '../controllers/admin.controller.ts';
import { AdminService } from '../services/admin.service.ts';
import { AnalyticsController } from '../controllers/analytics.controller.ts';
import { AnalyticsService } from '../services/analytics.service.ts';
import { AnalyticsRepository } from '../data/repositories/analytics.repository.ts';

export const registerDependencies = async () => {
  const dbClient = getDbClient();
  const redisClient = getRedisClient();

  container.registerInstance<DbClient>(TOKENS.db, dbClient);
  container.registerInstance<RedisClient>(TOKENS.redis, redisClient);

  container.register<UserRepository>(TOKENS.userRepository, { useClass: UserRepository });
  container.register<SkillRepository>(TOKENS.skillRepository, { useClass: SkillRepository });

  container.register<SkillController>(TOKENS.skillController, { useClass: SkillController });
  container.register<SkillService>(TOKENS.skillService, { useClass: SkillService });

  container.register<JobPostingController>(TOKENS.jobPostingController, { useClass: JobPostingController });
  container.register<JobPostingService>(TOKENS.jobPostingService, { useClass: JobPostingService });
  container.register<JobPostingRepository>(TOKENS.jobPostingRepository, { useClass: JobPostingRepository });

  container.register<JobApplicationController>(TOKENS.jobApplicationController, { useClass: JobApplicationController });
  container.register<JobApplicationService>(TOKENS.jobApplicationService, { useClass: JobApplicationService });
  container.register<JobApplicationRepository>(TOKENS.jobApplicationRepository, { useClass: JobApplicationRepository });

  container.register<CompanyController>(TOKENS.companyController, { useClass: CompanyController });
  container.register<CompanyService>(TOKENS.companyService, { useClass: CompanyService });
  container.register<CompanyRepository>(TOKENS.companyRepository, { useClass: CompanyRepository });

  container.register<AdminController>(TOKENS.adminController, { useClass: AdminController });
  container.register<AdminService>(TOKENS.adminService, { useClass: AdminService });

  container.register<AnalyticsController>(TOKENS.analyticsController, { useClass: AnalyticsController });
  container.register<AnalyticsService>(TOKENS.analyticsService, { useClass: AnalyticsService });
  container.register<AnalyticsRepository>(TOKENS.analyticsRepository, { useClass: AnalyticsRepository });

  container.register<MeController>(TOKENS.meController, { useClass: MeController });
  container.register<MeService>(TOKENS.meService, { useClass: MeService });

  container.register<OnboardingController>(TOKENS.onboardingController, { useClass: OnboardingController });
  container.register<OnboardingService>(TOKENS.onboardingService, { useClass: OnboardingService });
};
