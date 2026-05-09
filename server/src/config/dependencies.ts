import { DbClient, getDbClient } from './db-client.ts';
import { getRedisClient, RedisClient } from './redis-client.ts';
import { container } from 'tsyringe';
import { TOKENS } from './dependency-tokens.ts';
import { JobPostingService } from '../services/job-posting-service.ts';
import { JobPostingController } from '../controllers/job-posting-controller.ts';
import { JobPostingRepository } from '../data/repositories/job-posting.repository.ts';

export const registerDependencies = async () => {
  const dbClient = getDbClient();
  const redisClient = getRedisClient();

  container.registerInstance<DbClient>(TOKENS.db, dbClient);
  container.registerInstance<RedisClient>(TOKENS.redis, redisClient);

  container.register<JobPostingController>(TOKENS.jobPostingController, { useClass: JobPostingController });
  container.register<JobPostingService>(TOKENS.jobPostingService, { useClass: JobPostingService });
  container.register<JobPostingRepository>(TOKENS.jobPostingRepository, { useClass: JobPostingRepository });
};
