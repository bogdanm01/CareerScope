import 'dotenv/config';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { user } from '../src/data/schema/auth.schema.ts';
import { company } from '../src/data/schema/company.schema.ts';
import { applicationReview } from '../src/data/schema/application-review.schema.ts';
import { applicationStatusHistory } from '../src/data/schema/application-status-history.schema.ts';
import { jobApplication } from '../src/data/schema/job-application.schema.ts';
import { jobPosting } from '../src/data/schema/job-posting.schema.ts';
import { jobPostingSkill } from '../src/data/schema/job-posting-skill.schema.ts';
import { jobPostingStatusHistory } from '../src/data/schema/job-posting-status-history.schema.ts';
import { notification } from '../src/data/schema/notification.schema.ts';
import skill from '../src/data/schema/skill.schema.ts';
import { userSkill } from '../src/data/schema/user-skill.schema.ts';
import {
  COMPANY_APPROVAL_STATUS,
  JOB_APPLICATION_STATUS,
  JOB_POSTING_STATUS,
  ONBOARDING_STATUS,
  USER_ROLE,
} from '../src/data/util/constants.ts';
import env, { DATABASE_URL } from '../src/config/env.ts';

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { casing: 'snake_case' });

const now = () => new Date();
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const expandJobDescription = (description: string) => `${description}

## How you will work

You will join a cross-functional team that plans work collaboratively, ships in small increments, and reviews outcomes after release. Engineers, designers, and product partners share responsibility for quality and communicate directly when requirements or technical constraints change.

The team values clear written decisions, constructive code and design reviews, and enough documentation for another person to continue the work without relying on private context.

## What success looks like

During your first three months, you will learn the product domain, contribute to production work, and establish effective working relationships with the team. Over time, you will take ownership of larger initiatives, improve the systems around your work, and help make delivery more predictable.

Successful team members:

- Break ambiguous problems into practical milestones
- Communicate risks early and propose realistic alternatives
- Balance delivery speed with maintainability
- Use data and customer feedback to evaluate outcomes
- Share knowledge through reviews, pairing, and documentation

## Benefits and support

- Flexible hybrid working arrangements
- Equipment and home-office support
- Annual learning and conference budget
- Regular growth and compensation reviews
- Paid time off and private health coverage
- Dedicated time for technical improvements

## Hiring process

1. Introductory conversation with the recruiting team
2. Role-focused interview with future teammates
3. Practical discussion or take-home exercise relevant to the work
4. Final conversation covering collaboration, expectations, and offer details

We aim to provide clear next steps and useful feedback throughout the process.`;

const companies = [
  {
    name: 'Northstar Digital Labs',
    taxId: 'RS-104582913',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Product engineering studio for SaaS teams.',
    description: `## What we build

Northstar Digital Labs partners with growing software companies to deliver **customer-facing products**, internal platforms, and integration-heavy systems.

### How we work

- Small cross-functional product teams
- Continuous delivery and pragmatic engineering standards
- Direct collaboration with customers and domain experts
- Dedicated time for technical discovery and refactoring

We value ownership, clear communication, and software that remains easy to change.`,
    foundingYear: 2017,
    numberOfEmployees: 84,
    address: 'Bulevar Mihajla Pupina 10, Belgrade, Serbia',
    logoUrl: 'https://example.com/logos/northstar-digital-labs.png',
    websiteUrl: 'https://northstar-digital.example.com',
  },
  {
    name: 'AstraFin Systems',
    taxId: 'RS-782451006',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Fintech software and data infrastructure company.',
    description: `## Financial infrastructure for modern teams

AstraFin Systems develops payment workflows, reporting services, and risk analytics products used by regional finance teams.

Our platform processes high-volume transactional data and integrates with banks, payment providers, and compliance systems.

### Engineering priorities

1. Correctness and auditability
2. Secure-by-default APIs
3. Observable distributed systems
4. Reliable data pipelines`,
    foundingYear: 2014,
    numberOfEmployees: 146,
    address: 'Milutina Milankovica 9, Belgrade, Serbia',
    logoUrl: 'https://example.com/logos/astrafin-systems.png',
    websiteUrl: 'https://astrafin.example.com',
  },
  {
    name: 'GreenGrid Cloud',
    taxId: 'RS-639027411',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Cloud operations and infrastructure automation provider.',
    description: `## Reliable cloud platforms

GreenGrid Cloud helps product companies operate dependable infrastructure through managed Kubernetes, observability, and deployment automation.

### Services

- Cloud architecture and migration
- Kubernetes platform engineering
- CI/CD modernization
- Monitoring, alerting, and incident response

Our teams optimize for sustainable on-call practices and measurable reliability.`,
    foundingYear: 2019,
    numberOfEmployees: 58,
    address: 'Kneza Milosa 31, Belgrade, Serbia',
    logoUrl: 'https://example.com/logos/greengrid-cloud.png',
    websiteUrl: 'https://greengrid.example.com',
  },
  {
    name: 'OrbitWorks AI',
    taxId: 'RS-927614358',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Applied AI company focused on business automation.',
    description: `## Practical AI for operations

OrbitWorks AI creates document processing, workflow automation, and decision-support systems for operations-heavy organizations.

We combine **machine learning**, human review workflows, and measurable product outcomes rather than treating AI as a standalone feature.

### Product principles

- Keep humans in control
- Explain automated decisions
- Measure accuracy in production
- Protect customer data`,
    foundingYear: 2020,
    numberOfEmployees: 39,
    address: 'Vojvode Misica 12, Nis, Serbia',
    logoUrl: 'https://example.com/logos/orbitworks-ai.png',
    websiteUrl: 'https://orbitworks.example.com',
  },
  {
    name: 'BluePeak HealthTech',
    taxId: 'RS-510936284',
    approvalStatus: COMPANY_APPROVAL_STATUS.PENDING_APPROVAL,
    shortDescription: 'Healthcare scheduling and patient engagement startup.',
    description: `## Better clinic operations

BluePeak HealthTech is building tools for clinics to manage patient communication, appointment workflows, and operational reporting.

The product focuses on:

- Reducing missed appointments
- Improving front-desk efficiency
- Making patient communication accessible
- Giving clinic managers useful operational insights`,
    foundingYear: 2021,
    numberOfEmployees: 27,
    address: 'Cara Dusana 45, Novi Sad, Serbia',
    logoUrl: 'https://example.com/logos/bluepeak-healthtech.png',
    websiteUrl: 'https://bluepeak-health.example.com',
  },
  {
    name: 'Danube Commerce',
    taxId: 'RS-318475920',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Commerce platform for independent European retailers.',
    description: `## Commerce infrastructure for independent retail

Danube Commerce provides catalog, order, inventory, and analytics tools for multi-location retailers.

### Current focus

- Real-time inventory synchronization
- Faster merchant onboarding
- Accessible back-office workflows
- Reliable integrations with logistics partners`,
    foundingYear: 2016,
    numberOfEmployees: 112,
    address: 'Bulevar Oslobodjenja 76, Novi Sad, Serbia',
    logoUrl: 'https://example.com/logos/danube-commerce.png',
    websiteUrl: 'https://danube-commerce.example.com',
  },
  {
    name: 'SignalForge Security',
    taxId: 'RS-846205731',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Security monitoring and incident response software.',
    description: `## Security teams need better signal

SignalForge Security builds monitoring and incident-response software for engineering teams operating critical services.

Our platform connects logs, identity events, and infrastructure changes to help responders investigate incidents quickly.

We practice responsible disclosure and build security controls into every delivery stage.`,
    foundingYear: 2018,
    numberOfEmployees: 63,
    address: 'Kralja Petra 22, Belgrade, Serbia',
    logoUrl: 'https://example.com/logos/signalforge-security.png',
    websiteUrl: 'https://signalforge.example.com',
  },
] as const;

const users = [
  {
    key: 'admin',
    name: 'Mila Admin',
    email: 'mila.admin+seed@careerscope.local',
    firstName: 'Mila',
    lastName: 'Admin',
    role: USER_ROLE.ADMIN,
    dateOfBirth: '1990-01-14',
  },
  {
    key: 'recruiterNorthstar',
    name: 'Ivan Recruiter',
    email: 'ivan.recruiter+seed@careerscope.local',
    firstName: 'Ivan',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1988-09-02',
    companyTaxId: 'RS-104582913',
  },
  {
    key: 'recruiterAstra',
    name: 'Sara Recruiter',
    email: 'sara.recruiter+seed@careerscope.local',
    firstName: 'Sara',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1992-03-19',
    companyTaxId: 'RS-782451006',
  },
  {
    key: 'recruiterGreengrid',
    name: 'Marko Recruiter',
    email: 'marko.recruiter+seed@careerscope.local',
    firstName: 'Marko',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1986-12-04',
    companyTaxId: 'RS-639027411',
  },
  {
    key: 'recruiterBluePeak',
    name: 'Ivana Recruiter',
    email: 'ivana.recruiter+seed@careerscope.local',
    firstName: 'Ivana',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1990-08-18',
    companyTaxId: 'RS-510936284',
  },
  {
    key: 'recruiterDanube',
    name: 'Luka Recruiter',
    email: 'luka.recruiter+seed@careerscope.local',
    firstName: 'Luka',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1991-06-11',
    companyTaxId: 'RS-318475920',
  },
  {
    key: 'recruiterSignalForge',
    name: 'Nina Recruiter',
    email: 'nina.recruiter+seed@careerscope.local',
    firstName: 'Nina',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1989-10-27',
    companyTaxId: 'RS-846205731',
  },
  {
    key: 'candidatePetar',
    name: 'Petar Candidate',
    email: 'petar.candidate+seed@careerscope.local',
    firstName: 'Petar',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1997-05-22',
  },
  {
    key: 'candidateAna',
    name: 'Ana Candidate',
    email: 'ana.candidate+seed@careerscope.local',
    firstName: 'Ana',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1995-11-08',
  },
  {
    key: 'candidateJovana',
    name: 'Jovana Candidate',
    email: 'jovana.candidate+seed@careerscope.local',
    firstName: 'Jovana',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1998-07-16',
  },
  {
    key: 'candidateNikola',
    name: 'Nikola Candidate',
    email: 'nikola.candidate+seed@careerscope.local',
    firstName: 'Nikola',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1996-02-13',
  },
  {
    key: 'candidateMilica',
    name: 'Milica Candidate',
    email: 'milica.candidate+seed@careerscope.local',
    firstName: 'Milica',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1999-09-24',
  },
  {
    key: 'candidateStefan',
    name: 'Stefan Candidate',
    email: 'stefan.candidate+seed@careerscope.local',
    firstName: 'Stefan',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1994-04-30',
  },
  {
    key: 'candidateTeodora',
    name: 'Teodora Candidate',
    email: 'teodora.candidate+seed@careerscope.local',
    firstName: 'Teodora',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '2000-12-05',
  },
] as const;

const candidateSkills = [
  { userKey: 'candidatePetar', skillSlug: 'typescript', yearsOfExperience: 4 },
  { userKey: 'candidatePetar', skillSlug: 'reactjs', yearsOfExperience: 4 },
  { userKey: 'candidatePetar', skillSlug: 'nodejs', yearsOfExperience: 3 },
  { userKey: 'candidatePetar', skillSlug: 'postgresql', yearsOfExperience: 2 },
  { userKey: 'candidateAna', skillSlug: 'python', yearsOfExperience: 5 },
  { userKey: 'candidateAna', skillSlug: 'postgresql', yearsOfExperience: 4 },
  { userKey: 'candidateAna', skillSlug: 'docker', yearsOfExperience: 3 },
  { userKey: 'candidateAna', skillSlug: 'aws', yearsOfExperience: 2 },
  { userKey: 'candidateJovana', skillSlug: 'ui-ux-design', yearsOfExperience: 4 },
  { userKey: 'candidateJovana', skillSlug: 'figma', yearsOfExperience: 4 },
  { userKey: 'candidateJovana', skillSlug: 'user-research', yearsOfExperience: 3 },
  { userKey: 'candidateJovana', skillSlug: 'prototyping', yearsOfExperience: 3 },
  { userKey: 'candidateNikola', skillSlug: 'java', yearsOfExperience: 5 },
  { userKey: 'candidateNikola', skillSlug: 'springboot', yearsOfExperience: 4 },
  { userKey: 'candidateNikola', skillSlug: 'microservices-architecture', yearsOfExperience: 3 },
  { userKey: 'candidateNikola', skillSlug: 'apache-kafka', yearsOfExperience: 2 },
  { userKey: 'candidateNikola', skillSlug: 'postgresql', yearsOfExperience: 4 },
  { userKey: 'candidateMilica', skillSlug: 'reactjs', yearsOfExperience: 3 },
  { userKey: 'candidateMilica', skillSlug: 'typescript', yearsOfExperience: 3 },
  { userKey: 'candidateMilica', skillSlug: 'css', yearsOfExperience: 4 },
  { userKey: 'candidateMilica', skillSlug: 'design-systems', yearsOfExperience: 2 },
  { userKey: 'candidateMilica', skillSlug: 'playwright', yearsOfExperience: 2 },
  { userKey: 'candidateStefan', skillSlug: 'aws', yearsOfExperience: 5 },
  { userKey: 'candidateStefan', skillSlug: 'kubernetes', yearsOfExperience: 4 },
  { userKey: 'candidateStefan', skillSlug: 'infrastructure-as-code', yearsOfExperience: 3 },
  { userKey: 'candidateStefan', skillSlug: 'observability', yearsOfExperience: 4 },
  { userKey: 'candidateStefan', skillSlug: 'linux', yearsOfExperience: 6 },
  { userKey: 'candidateTeodora', skillSlug: 'python', yearsOfExperience: 3 },
  { userKey: 'candidateTeodora', skillSlug: 'data-analysis', yearsOfExperience: 3 },
  { userKey: 'candidateTeodora', skillSlug: 'sql', yearsOfExperience: 3 },
  { userKey: 'candidateTeodora', skillSlug: 'data-visualization', yearsOfExperience: 2 },
  { userKey: 'candidateTeodora', skillSlug: 'business-intelligence', yearsOfExperience: 2 },
  { userKey: 'candidateTeodora', skillSlug: 'communication', yearsOfExperience: null },
] as const;

const jobs = [
  {
    title: 'Senior Fullstack Engineer',
    companyTaxId: 'RS-104582913',
    createdByUserKey: 'recruiterNorthstar',
    shortDescription: 'Build SaaS product features with TypeScript, React, Node.js, and PostgreSQL.',
    description: `## The role

Join a product engineering team building customer-facing SaaS features, internal tooling, and API integrations for growth-stage clients.

### What you will do

- Design and ship end-to-end product features
- Build typed APIs and reliable background jobs
- Improve performance, observability, and test coverage
- Review code and mentor engineers
- Work directly with product and design

### What we offer

- Flexible hybrid work
- Annual learning budget
- Clear engineering progression
- Modern TypeScript stack`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(45),
    skills: [
      { slug: 'typescript', yoe: 4 },
      { slug: 'reactjs', yoe: 4 },
      { slug: 'nodejs', yoe: 3 },
      { slug: 'postgresql', yoe: 2 },
    ],
  },
  {
    title: 'Backend Platform Engineer',
    companyTaxId: 'RS-782451006',
    createdByUserKey: 'recruiterAstra',
    shortDescription: 'Own payment workflow services, reporting APIs, and operational data pipelines.',
    description: `## The role

Work on high-volume backend services for payment workflows, reporting, risk checks, and integrations with external financial systems.

### Responsibilities

- Own services from design through production operations
- Model transactional data and audit trails
- Build secure partner APIs
- Improve queue processing and failure recovery
- Participate in architecture reviews

Experience with regulated systems is useful but not required.`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(30),
    skills: [
      { slug: 'nodejs', yoe: 4 },
      { slug: 'postgresql', yoe: 4 },
      { slug: 'redis', yoe: 2 },
      { slug: 'docker', yoe: 2 },
    ],
  },
  {
    title: 'Product Designer',
    companyTaxId: 'RS-927614358',
    createdByUserKey: 'admin',
    shortDescription: 'Design workflow automation experiences for operations-heavy business users.',
    description: `## Design practical AI products

Create research-backed product flows, prototypes, and UI systems for document processing and workflow automation products.

### You will

- Interview operations teams and map complex workflows
- Prototype human-in-the-loop AI experiences
- Maintain reusable patterns in the design system
- Partner with engineers during implementation
- Validate releases with usability testing`,
    status: JOB_POSTING_STATUS.PENDING_APPROVAL,
    expiresAt: daysFromNow(60),
    skills: [
      { slug: 'ui-ux-design', yoe: 3 },
      { slug: 'reactjs', yoe: 1 },
    ],
  },
  {
    title: 'DevOps Engineer',
    companyTaxId: 'RS-639027411',
    createdByUserKey: 'recruiterGreengrid',
    shortDescription: 'Run cloud infrastructure, CI/CD, containers, and observability for customer platforms.',
    description: `## Build reliable platforms

Help engineering teams operate reliable cloud platforms with deployment automation, container orchestration, monitoring, and incident response practices.

### Your impact

- Standardize Kubernetes deployments
- Improve CI/CD speed and safety
- Build actionable dashboards and alerts
- Automate infrastructure changes
- Lead blameless incident reviews`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(50),
    skills: [
      { slug: 'docker', yoe: 3 },
      { slug: 'kubernetes', yoe: 2 },
      { slug: 'aws', yoe: 2 },
      { slug: 'ci-cd-pipelines', yoe: 2 },
    ],
  },
  {
    title: 'Frontend Platform Engineer',
    companyTaxId: 'RS-318475920',
    createdByUserKey: 'recruiterDanube',
    shortDescription: 'Build the component platform used across merchant and operations products.',
    description: `## Build the frontend foundation

Danube Commerce is creating a shared frontend platform for merchant, inventory, and operations products.

### What you will own

- Accessible React components and design tokens
- Frontend build tooling and performance budgets
- Testing patterns for critical commerce flows
- Documentation and migration guidance

You will work closely with product designers and feature teams.`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(40),
    skills: [
      { slug: 'reactjs', yoe: 3 },
      { slug: 'typescript', yoe: 3 },
      { slug: 'css', yoe: 3 },
      { slug: 'design-systems', yoe: 2 },
      { slug: 'playwright', yoe: 1 },
    ],
  },
  {
    title: 'Security Software Engineer',
    companyTaxId: 'RS-846205731',
    createdByUserKey: 'recruiterSignalForge',
    shortDescription: 'Develop detection, investigation, and incident-response capabilities.',
    description: `## Build security products engineers trust

You will develop backend services and investigation workflows that turn infrastructure and identity events into actionable security signals.

### Responsibilities

- Build event ingestion and correlation services
- Design secure APIs and authorization boundaries
- Improve detection quality with production feedback
- Partner with security researchers
- Document threat models and operational runbooks`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(55),
    skills: [
      { slug: 'go', yoe: 3 },
      { slug: 'postgresql', yoe: 2 },
      { slug: 'apache-kafka', yoe: 2 },
      { slug: 'web-security', yoe: 2 },
      { slug: 'distributed-systems', yoe: 2 },
    ],
  },
  {
    title: 'Data Analyst',
    companyTaxId: 'RS-318475920',
    createdByUserKey: 'recruiterDanube',
    shortDescription: 'Turn commerce and inventory data into decisions for merchants.',
    description: `## Make commerce data useful

Partner with product, finance, and operations teams to define metrics and build trustworthy reporting.

### Day-to-day work

- Write and review analytical SQL
- Build dashboards for merchant performance
- Investigate inventory and fulfillment trends
- Define metric ownership and documentation
- Present findings to non-technical stakeholders`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(35),
    skills: [
      { slug: 'sql', yoe: 2 },
      { slug: 'data-analysis', yoe: 2 },
      { slug: 'data-visualization', yoe: 2 },
      { slug: 'business-intelligence', yoe: 1 },
      { slug: 'communication', yoe: 2 },
    ],
  },
  {
    title: 'Senior Java Engineer',
    companyTaxId: 'RS-782451006',
    createdByUserKey: 'recruiterAstra',
    shortDescription: 'Modernize transaction services and event-driven integrations.',
    description: `## Modernize core financial services

Lead the evolution of transaction processing services from tightly coupled modules to observable, event-driven components.

### You will

- Design Spring Boot services and domain boundaries
- Evolve Kafka event contracts safely
- Improve database performance and resilience
- Coach engineers through complex migrations
- Contribute to architecture standards`,
    status: JOB_POSTING_STATUS.PAUSED,
    expiresAt: daysFromNow(70),
    skills: [
      { slug: 'java', yoe: 5 },
      { slug: 'springboot', yoe: 4 },
      { slug: 'apache-kafka', yoe: 2 },
      { slug: 'microservices-architecture', yoe: 3 },
      { slug: 'postgresql', yoe: 3 },
    ],
  },
  {
    title: 'Machine Learning Engineer',
    companyTaxId: 'RS-927614358',
    createdByUserKey: 'admin',
    shortDescription: 'Productionize document intelligence and classification models.',
    description: `## Move models into production

Build training, evaluation, and serving workflows for document classification and information extraction.

### Focus areas

- Reproducible training pipelines
- Offline and online evaluation
- Model monitoring and drift detection
- Human review feedback loops
- Privacy-aware data handling`,
    status: JOB_POSTING_STATUS.PENDING_APPROVAL,
    expiresAt: daysFromNow(65),
    skills: [
      { slug: 'python', yoe: 3 },
      { slug: 'machine-learning', yoe: 3 },
      { slug: 'natural-language-processing', yoe: 2 },
      { slug: 'mlops', yoe: 1 },
      { slug: 'docker', yoe: 2 },
    ],
  },
  {
    title: 'QA Automation Engineer',
    companyTaxId: 'RS-104582913',
    createdByUserKey: 'recruiterNorthstar',
    shortDescription: 'Own automated quality practices across web products and APIs.',
    description: `## Improve confidence in every release

Create practical automation that catches regressions early and helps teams understand product risk.

### Responsibilities

- Build Playwright end-to-end suites
- Test REST APIs and integration boundaries
- Improve CI feedback and flaky-test diagnostics
- Define test data strategies
- Coach teams on testable product design`,
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(28),
    skills: [
      { slug: 'test-automation', yoe: 3 },
      { slug: 'playwright', yoe: 2 },
      { slug: 'rest-api-development', yoe: 2 },
      { slug: 'integration-testing', yoe: 2 },
      { slug: 'ci-cd-pipelines', yoe: 1 },
    ],
  },
  {
    title: 'Site Reliability Engineer',
    companyTaxId: 'RS-639027411',
    createdByUserKey: 'recruiterGreengrid',
    shortDescription: 'Improve availability, observability, and operational readiness.',
    description: `## Reliability as a product capability

Work with platform and application teams to make reliability measurable and operational work sustainable.

### You will

- Define service-level objectives
- Improve telemetry and alert quality
- Automate repetitive operational work
- Review capacity and failure modes
- Facilitate incident learning`,
    status: JOB_POSTING_STATUS.CLOSED,
    expiresAt: daysAgo(5),
    skills: [
      { slug: 'observability', yoe: 3 },
      { slug: 'kubernetes', yoe: 3 },
      { slug: 'aws', yoe: 3 },
      { slug: 'linux', yoe: 4 },
      { slug: 'infrastructure-as-code', yoe: 2 },
    ],
  },
  {
    title: 'Junior Product Designer',
    companyTaxId: 'RS-510936284',
    createdByUserKey: 'admin',
    shortDescription: 'Support patient and clinic workflow design across web products.',
    description: `## Design clearer healthcare workflows

Support research, wireframing, prototyping, and design-system work for clinic operations software.

### This role is suited for someone who

- Enjoys simplifying complex forms and workflows
- Can explain design decisions clearly
- Values accessibility and inclusive research
- Wants close collaboration with engineering`,
    status: JOB_POSTING_STATUS.DRAFT,
    expiresAt: daysFromNow(90),
    skills: [
      { slug: 'ui-ux-design', yoe: 1 },
      { slug: 'figma', yoe: 1 },
      { slug: 'wireframing', yoe: 1 },
      { slug: 'prototyping', yoe: 1 },
      { slug: 'user-research', yoe: 1 },
    ],
  },
] as const;

const seededJobLogistics = [
  { workLocation: 'Hybrid', employmentType: 'FullTime', salaryRange: '$120k - $160k' },
  { workLocation: 'Remote', employmentType: 'FullTime', salaryRange: '$110k - $150k' },
  { workLocation: 'Hybrid', employmentType: 'FullTime', salaryRange: '$85k - $115k' },
  { workLocation: 'Remote', employmentType: 'Contract', salaryRange: '$90k - $130k' },
  { workLocation: 'Hybrid', employmentType: 'FullTime', salaryRange: '$100k - $140k' },
  { workLocation: 'Remote', employmentType: 'FullTime', salaryRange: '$115k - $155k' },
  { workLocation: 'OnSite', employmentType: 'FullTime', salaryRange: '$70k - $95k' },
  { workLocation: 'Hybrid', employmentType: 'FullTime', salaryRange: '$115k - $150k' },
  { workLocation: 'Remote', employmentType: 'FullTime', salaryRange: '$120k - $165k' },
  { workLocation: 'Hybrid', employmentType: 'FullTime', salaryRange: '$75k - $105k' },
  { workLocation: 'Remote', employmentType: 'FullTime', salaryRange: '$115k - $155k' },
  { workLocation: 'Hybrid', employmentType: 'Internship', salaryRange: '$45k - $60k' },
] as const;

const applications = [
  {
    userKey: 'candidatePetar',
    jobTitle: 'Senior Fullstack Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateAna',
    jobTitle: 'Backend Platform Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'Backend Platform Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  { userKey: 'candidateJovana', jobTitle: 'Product Designer', status: JOB_APPLICATION_STATUS.ACCEPTED },
  { userKey: 'candidateAna', jobTitle: 'DevOps Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  { userKey: 'candidatePetar', jobTitle: 'DevOps Engineer', status: JOB_APPLICATION_STATUS.REJECTED },
  {
    userKey: 'candidateMilica',
    jobTitle: 'Frontend Platform Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'Frontend Platform Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Senior Java Engineer',
    status: JOB_APPLICATION_STATUS.ACCEPTED,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Backend Platform Engineer',
    status: JOB_APPLICATION_STATUS.REJECTED,
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Site Reliability Engineer',
    status: JOB_APPLICATION_STATUS.ACCEPTED,
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'DevOps Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Security Software Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateTeodora',
    jobTitle: 'Data Analyst',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateAna',
    jobTitle: 'Data Analyst',
    status: JOB_APPLICATION_STATUS.WITHDRAWN,
  },
  {
    userKey: 'candidateTeodora',
    jobTitle: 'Machine Learning Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateMilica',
    jobTitle: 'QA Automation Engineer',
    status: JOB_APPLICATION_STATUS.ACCEPTED,
  },
  {
    userKey: 'candidateJovana',
    jobTitle: 'Frontend Platform Engineer',
    status: JOB_APPLICATION_STATUS.REJECTED,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'QA Automation Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Security Software Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
] as const;

const applicationReviews = [
  {
    userKey: 'candidateJovana',
    jobTitle: 'Product Designer',
    rating: 5,
    comment: 'Clear process, fast feedback, and a thoughtful design challenge.',
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'DevOps Engineer',
    rating: 3,
    comment: 'Useful screening call, but the role was more infrastructure-heavy than expected.',
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Senior Java Engineer',
    rating: 5,
    comment: 'The interview covered architecture tradeoffs and gave a clear picture of the team.',
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Site Reliability Engineer',
    rating: 4,
    comment: 'Strong technical discussion and transparent expectations about on-call work.',
  },
  {
    userKey: 'candidateMilica',
    jobTitle: 'QA Automation Engineer',
    rating: 4,
    comment: 'Practical exercise, quick feedback, and a well-structured interview process.',
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Backend Platform Engineer',
    rating: 3,
    comment: 'The process was professional, although the final feedback could have been more detailed.',
  },
] as const;

const notifications = [
  {
    userKey: 'candidatePetar',
    payload: {
      type: 'application_status_changed',
      title: 'Application under review',
      message: 'Your application for Senior Fullstack Engineer is now under review.',
    },
  },
  {
    userKey: 'recruiterAstra',
    payload: {
      type: 'new_application',
      title: 'New application received',
      message: 'Petar Candidate applied for Backend Platform Engineer.',
    },
  },
  {
    userKey: 'candidateJovana',
    payload: {
      type: 'application_status_changed',
      title: 'Application accepted',
      message: 'Your application for Product Designer was accepted.',
    },
  },
  {
    userKey: 'candidateMilica',
    payload: {
      type: 'application_status_changed',
      title: 'Application under review',
      message: 'Your application for Frontend Platform Engineer is now under review.',
    },
  },
  {
    userKey: 'candidateNikola',
    payload: {
      type: 'application_status_changed',
      title: 'Application accepted',
      message: 'Your application for Senior Java Engineer was accepted.',
    },
  },
  {
    userKey: 'candidateStefan',
    payload: {
      type: 'application_status_changed',
      title: 'Application accepted',
      message: 'Your application for Site Reliability Engineer was accepted.',
    },
  },
  {
    userKey: 'candidateTeodora',
    payload: {
      type: 'application_status_changed',
      title: 'Application under review',
      message: 'Your application for Data Analyst is now under review.',
    },
  },
  {
    userKey: 'recruiterDanube',
    payload: {
      type: 'new_application',
      title: 'New application received',
      message: 'Milica Candidate applied for Frontend Platform Engineer.',
    },
  },
  {
    userKey: 'recruiterSignalForge',
    payload: {
      type: 'new_application',
      title: 'New application received',
      message: 'Stefan Candidate applied for Security Software Engineer.',
    },
  },
  {
    userKey: 'candidateAna',
    payload: {
      type: 'application_status_changed',
      title: 'Application withdrawn',
      message: 'Your application for Data Analyst was withdrawn.',
    },
  },
] as const;

type ApplicationSeedRecord = {
  id: number;
  companyId: number;
};

type UserKey = (typeof users)[number]['key'];

const getBySlug = async () => {
  const rows = await db.select({ id: skill.id, slug: skill.slug }).from(skill);
  return new Map(rows.map((row) => [row.slug, row.id]));
};

const getCompaniesByTaxId = async () => {
  const rows = await db.select({ id: company.id, taxId: company.taxId }).from(company);
  return new Map(rows.map((row) => [row.taxId, row.id]));
};

const getSeedUsersByKey = async () => {
  const rows = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(
      inArray(
        user.email,
        users.map((item) => item.email),
      ),
    );
  const userByEmail = new Map(rows.map((row) => [row.email, row.id]));
  const userByKey = new Map<UserKey, string>();

  for (const item of users) {
    userByKey.set(item.key, requireMapValue(userByEmail, item.email, 'auth-created seed user email'));
  }

  return userByKey;
};

const requireMapValue = <T>(map: Map<string, T>, key: string, sourceName: string): T => {
  const value = map.get(key);

  if (value === undefined) {
    throw new Error(
      `Missing ${sourceName} "${key}". Run database migrations and scripts/seed-auth-users.sh before running the dummy seed script.`,
    );
  }

  return value;
};

const seedCompanies = async () => {
  for (const item of companies) {
    const isApproved = item.approvalStatus === COMPANY_APPROVAL_STATUS.APPROVED;

    await db
      .insert(company)
      .values({
        name: item.name,
        isApproved,
        approvalStatus: item.approvalStatus,
        approvedAt: isApproved ? daysAgo(120) : null,
        approvalRejectionReason: null,
        taxId: item.taxId,
        shortDescription: item.shortDescription,
        description: item.description,
        foundingYear: item.foundingYear,
        numberOfEmployees: item.numberOfEmployees,
        address: item.address,
        logoUrl: item.logoUrl,
        websiteUrl: item.websiteUrl,
        isDeleted: false,
      })
      .onConflictDoUpdate({
        target: company.taxId,
        set: {
          name: item.name,
          isApproved,
          approvalStatus: item.approvalStatus,
          approvedAt: isApproved ? daysAgo(120) : null,
          approvalRejectionReason: null,
          shortDescription: item.shortDescription,
          description: item.description,
          foundingYear: item.foundingYear,
          numberOfEmployees: item.numberOfEmployees,
          address: item.address,
          logoUrl: item.logoUrl,
          websiteUrl: item.websiteUrl,
          isDeleted: false,
        },
      });
  }
};

const seedUsers = async () => {
  const companiesByTaxId = await getCompaniesByTaxId();
  const companyApprovalStatusByTaxId = new Map(companies.map((item) => [item.taxId, item.approvalStatus]));
  const userByKey = await getSeedUsersByKey();

  for (const item of users) {
    const companyId =
      'companyTaxId' in item ? requireMapValue(companiesByTaxId, item.companyTaxId, 'company tax id') : null;
    const onboardingStatus =
      item.role === USER_ROLE.RECRUITER && 'companyTaxId' in item
        ? companyApprovalStatusByTaxId.get(item.companyTaxId) === COMPANY_APPROVAL_STATUS.APPROVED
          ? ONBOARDING_STATUS.COMPLETED
          : ONBOARDING_STATUS.COMPANY_PENDING_APPROVAL
        : ONBOARDING_STATUS.COMPLETED;

    await db
      .update(user)
      .set({
        name: item.name,
        email: item.email,
        firstName: item.firstName,
        lastName: item.lastName,
        emailVerified: true,
        companyId,
        role: item.role,
        dateOfBirth: item.dateOfBirth,
        isDeleted: false,
        onboardingStatus,
        updatedAt: now(),
      })
      .where(inArray(user.id, [requireMapValue(userByKey, item.key, 'seed user key')]));
  }

  await db
    .update(user)
    .set({
      onboardingStatus: ONBOARDING_STATUS.SKILLS_ADDED,
      updatedAt: now(),
    })
    .where(and(eq(user.role, USER_ROLE.CANDIDATE), isNull(user.cvUrl)));

  return userByKey;
};

const seedUserSkills = async (userByKey: Map<UserKey, string>) => {
  const skillBySlug = await getBySlug();
  const candidateUserIds = users
    .filter((item) => item.role === USER_ROLE.CANDIDATE)
    .map((item) => requireMapValue(userByKey, item.key, 'seed user key'));

  await db.delete(userSkill).where(inArray(userSkill.userId, candidateUserIds));

  await db.insert(userSkill).values(
    candidateSkills.map((item) => ({
      userId: requireMapValue(userByKey, item.userKey, 'seed user key'),
      skillId: requireMapValue(skillBySlug, item.skillSlug, 'skill slug'),
      yearsOfExperience: item.yearsOfExperience,
    })),
  );
};

const removeSeedJobs = async () => {
  const seedJobTitles = jobs.flatMap((item) => [item.title, `[Seed] ${item.title}`]);
  const existingJobs = await db
    .select({ id: jobPosting.id })
    .from(jobPosting)
    .where(inArray(jobPosting.title, seedJobTitles));

  const jobIds = existingJobs.map((item) => item.id);

  if (jobIds.length === 0) {
    return;
  }

  const existingApplications = await db
    .select({ id: jobApplication.id })
    .from(jobApplication)
    .where(inArray(jobApplication.jobPostingId, jobIds));
  const applicationIds = existingApplications.map((item) => item.id);

  if (applicationIds.length > 0) {
    await db.delete(applicationReview).where(inArray(applicationReview.jobApplicationId, applicationIds));
    await db.delete(applicationStatusHistory).where(inArray(applicationStatusHistory.jobApplicationId, applicationIds));
  }

  await db.delete(jobApplication).where(inArray(jobApplication.jobPostingId, jobIds));
  await db.delete(jobPostingStatusHistory).where(inArray(jobPostingStatusHistory.jobPostingId, jobIds));
  await db.delete(jobPostingSkill).where(inArray(jobPostingSkill.jobPostingId, jobIds));
  await db.delete(jobPosting).where(inArray(jobPosting.id, jobIds));
};

const getJobPostingStatusSequence = (status: string) => {
  switch (status) {
    case JOB_POSTING_STATUS.DRAFT:
      return [JOB_POSTING_STATUS.DRAFT];
    case JOB_POSTING_STATUS.PENDING_APPROVAL:
      return [JOB_POSTING_STATUS.DRAFT, JOB_POSTING_STATUS.PENDING_APPROVAL];
    case JOB_POSTING_STATUS.REJECTED:
      return [JOB_POSTING_STATUS.DRAFT, JOB_POSTING_STATUS.PENDING_APPROVAL, JOB_POSTING_STATUS.REJECTED];
    case JOB_POSTING_STATUS.PAUSED:
      return [
        JOB_POSTING_STATUS.DRAFT,
        JOB_POSTING_STATUS.PENDING_APPROVAL,
        JOB_POSTING_STATUS.ACTIVE,
        JOB_POSTING_STATUS.PAUSED,
      ];
    case JOB_POSTING_STATUS.CLOSED:
    case JOB_POSTING_STATUS.EXPIRED:
      return [
        JOB_POSTING_STATUS.DRAFT,
        JOB_POSTING_STATUS.PENDING_APPROVAL,
        JOB_POSTING_STATUS.ACTIVE,
        status,
      ];
    default:
      return [JOB_POSTING_STATUS.DRAFT, JOB_POSTING_STATUS.PENDING_APPROVAL, JOB_POSTING_STATUS.ACTIVE];
  }
};

const seedJobs = async (userByKey: Map<UserKey, string>) => {
  const companiesByTaxId = await getCompaniesByTaxId();
  const skillBySlug = await getBySlug();
  const jobByTitle = new Map<string, number>();

  await removeSeedJobs();

  for (const [jobIndex, item] of jobs.entries()) {
    const companyId = requireMapValue(companiesByTaxId, item.companyTaxId, 'company tax id');
    const logistics = seededJobLogistics[jobIndex % seededJobLogistics.length];
    const createdAt = daysAgo(70 - jobIndex * 3);
    const [createdJob] = await db
      .insert(jobPosting)
      .values({
        companyId,
        title: item.title,
        shortDescription: item.shortDescription,
        description: expandJobDescription(item.description),
        workLocation: logistics.workLocation,
        employmentType: logistics.employmentType,
        salaryRange: logistics.salaryRange,
        status: item.status,
        expiresAt: item.expiresAt,
        createdBy: requireMapValue(userByKey, item.createdByUserKey, 'seed user key'),
        createdAt,
        updatedAt: daysAgo(Math.max(1, 20 - jobIndex)),
      })
      .returning({ id: jobPosting.id });

    jobByTitle.set(item.title, createdJob.id);

    await db.insert(jobPostingSkill).values(
      item.skills.map((requiredSkill) => ({
        jobPostingId: createdJob.id,
        skillId: requireMapValue(skillBySlug, requiredSkill.slug, 'skill slug'),
        yoe: requiredSkill.yoe,
      })),
    );

    const statusSequence = getJobPostingStatusSequence(item.status);
    await db.insert(jobPostingStatusHistory).values(
      statusSequence.map((status, statusIndex) => ({
        jobPostingId: createdJob.id,
        status,
        reason: statusIndex === 0 ? 'Posting created from seed data.' : `Posting moved to ${status}.`,
        createdAt: new Date(createdAt.getTime() + statusIndex * 4 * 24 * 60 * 60 * 1000),
      })),
    );
  }

  return jobByTitle;
};

const seedApplications = async (jobByTitle: Map<string, number>, userByKey: Map<UserKey, string>) => {
  const companiesByTaxId = await getCompaniesByTaxId();
  const applicationByKey = new Map<string, ApplicationSeedRecord>();

  for (const [applicationIndex, item] of applications.entries()) {
    const jobSeed = jobs.find((job) => job.title === item.jobTitle);

    if (!jobSeed) {
      throw new Error(`Missing seed job definition for application "${item.jobTitle}".`);
    }

    const [createdApplication] = await db
      .insert(jobApplication)
      .values({
        userId: requireMapValue(userByKey, item.userKey, 'seed user key'),
        jobPostingId: requireMapValue(jobByTitle, item.jobTitle, 'seed job title'),
        status: item.status,
        createdAt: daysAgo(35 - (applicationIndex % 24)),
        updatedAt: daysAgo(Math.max(1, 15 - (applicationIndex % 12))),
      })
      .returning({ id: jobApplication.id });

    applicationByKey.set(`${item.userKey}:${item.jobTitle}`, {
      id: createdApplication.id,
      companyId: requireMapValue(companiesByTaxId, jobSeed.companyTaxId, 'company tax id'),
    });

    const statusSequence =
      item.status === JOB_APPLICATION_STATUS.SUBMITTED
        ? [JOB_APPLICATION_STATUS.SUBMITTED]
        : [JOB_APPLICATION_STATUS.SUBMITTED, item.status];

    await db.insert(applicationStatusHistory).values(
      statusSequence.map((status, statusIndex) => ({
        jobApplicationId: createdApplication.id,
        status,
        reason: statusIndex === 0 ? 'Application submitted.' : `Application moved to ${status}.`,
        createdAt: daysAgo(Math.max(0, 35 - (applicationIndex % 24) - statusIndex * 3)),
      })),
    );
  }

  return applicationByKey;
};

const seedApplicationReviews = async (applicationByKey: Map<string, ApplicationSeedRecord>) => {
  await db.insert(applicationReview).values(
    applicationReviews.map((item) => {
      const application = requireMapValue(
        applicationByKey,
        `${item.userKey}:${item.jobTitle}`,
        'seed application review target',
      );

      return {
        jobApplicationId: application.id,
        companyId: application.companyId,
        rating: item.rating,
        comment: item.comment,
      };
    }),
  );
};

const seedNotifications = async (userByKey: Map<UserKey, string>) => {
  await db.delete(notification).where(
    inArray(
      notification.userId,
      notifications.map((item) => requireMapValue(userByKey, item.userKey, 'seed user key')),
    ),
  );

  await db.insert(notification).values(
    notifications.map((item) => ({
      userId: requireMapValue(userByKey, item.userKey, 'seed user key'),
      payload: item.payload,
    })),
  );
};

const main = async () => {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Seed dummy data for local/dev use.');
    console.log('');
    console.log('Usage: npm run db:seed');
    console.log('');
    console.log('Requires the same database environment variables as the API server.');
    return;
  }

  console.log(`Seeding dummy data into ${env.NODE_ENV ?? 'local'} database...`);

  await seedCompanies();
  const userByKey = await seedUsers();
  await seedUserSkills(userByKey);
  const jobByTitle = await seedJobs(userByKey);
  const applicationByKey = await seedApplications(jobByTitle, userByKey);
  await seedApplicationReviews(applicationByKey);
  await seedNotifications(userByKey);

  console.log('Dummy seed data inserted.');
};

main()
  .catch((error: unknown) => {
    console.error('Failed to seed dummy data.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
