export const TOKENS = {
  db: Symbol('DbClient'),
  redis: Symbol('RedisClient'),

  jobPostingController: Symbol('JobPostingController'),
  jobPostingService: Symbol('JobPostingService'),
  jobPostingRepository: Symbol('JobPostingRepository'),

  jobApplicationController: Symbol('JobApplicationController'),
  jobApplicationService: Symbol('JobApplicationService'),
  jobApplicationRepository: Symbol('JobApplicationRepository'),
} as const;
