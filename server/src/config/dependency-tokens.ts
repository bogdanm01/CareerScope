export const TOKENS = {
  db: Symbol('DbClient'),
  redis: Symbol('RedisClient'),

  userRepository: Symbol('UserRepository'),
  skillRepository: Symbol('SkillRepository'),

  skillController: Symbol('SkillController'),
  skillService: Symbol('SkillService'),

  jobPostingController: Symbol('JobPostingController'),
  jobPostingService: Symbol('JobPostingService'),
  jobPostingRepository: Symbol('JobPostingRepository'),

  jobApplicationController: Symbol('JobApplicationController'),
  jobApplicationService: Symbol('JobApplicationService'),
  jobApplicationRepository: Symbol('JobApplicationRepository'),

  companyController: Symbol('CompanyController'),
  companyService: Symbol('CompanyService'),
  companyRepository: Symbol('CompanyRepository'),

  meController: Symbol('MeController'),
  meService: Symbol('MeService'),

  onboardingController: Symbol('OnboardingController'),
  onboardingService: Symbol('OnboardingService'),
} as const;
