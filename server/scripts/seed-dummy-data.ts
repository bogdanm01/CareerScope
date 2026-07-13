import 'dotenv/config';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { user } from '../src/data/schema/auth.schema.ts';
import { company } from '../src/data/schema/company.schema.ts';
import { applicationReview } from '../src/data/schema/application-review.schema.ts';
import { applicationStatusHistory } from '../src/data/schema/application-status-history.schema.ts';
import { jobApplicationHiringStage } from '../src/data/schema/job-application-hiring-stage.schema.ts';
import { jobApplication } from '../src/data/schema/job-application.schema.ts';
import { jobPostingHiringStage } from '../src/data/schema/job-posting-hiring-stage.schema.ts';
import { jobPosting } from '../src/data/schema/job-posting.schema.ts';
import { jobPostingSkill } from '../src/data/schema/job-posting-skill.schema.ts';
import { jobPostingStatusHistory } from '../src/data/schema/job-posting-status-history.schema.ts';
import { notification } from '../src/data/schema/notification.schema.ts';
import skill from '../src/data/schema/skill.schema.ts';
import { userSkill } from '../src/data/schema/user-skill.schema.ts';
import {
  COMPANY_APPROVAL_STATUS,
  JOB_APPLICATION_ACTIVITY_STATUS,
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
    name: 'Microsoft',
    taxId: 'RS-104582913',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Technology company building cloud, productivity, developer, and AI platforms.',
    description: `## Technology platforms for work and development

Microsoft builds software, cloud infrastructure, developer tools, business applications, gaming products, and AI services used by organizations and consumers around the world.

### Product areas

- Azure cloud infrastructure and platform services
- Microsoft 365 productivity and collaboration tools
- GitHub and developer workflows
- Dynamics business applications
- Windows, Xbox, and consumer services

The company focuses on helping people and organizations be more productive through integrated software, cloud, and AI capabilities.`,
    foundingYear: 1975,
    numberOfEmployees: 221000,
    address: 'One Microsoft Way, Redmond, WA, USA',
    logoUrl: null,
    websiteUrl: 'https://www.microsoft.com',
  },
  {
    name: 'Stripe',
    taxId: 'RS-782451006',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Financial infrastructure platform for online payments and business operations.',
    description: `## Financial infrastructure for the internet

Stripe builds payment processing, billing, fraud prevention, tax, issuing, and financial workflow tools for businesses operating online and across platforms.

Its APIs and dashboard help companies accept payments, manage subscriptions, automate revenue operations, and launch marketplace or platform payment flows.

### Product areas

- Payments and checkout
- Billing and subscriptions
- Connect platform payments
- Radar fraud prevention
- Revenue and tax automation`,
    foundingYear: 2010,
    numberOfEmployees: 8500,
    address: '354 Oyster Point Blvd, South San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://stripe.com',
  },
  {
    name: 'Cloudflare',
    taxId: 'RS-639027411',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Connectivity cloud company for security, performance, and developer services.',
    description: `## Connectivity cloud

Cloudflare provides a global network that helps organizations make websites, applications, APIs, and networks faster, safer, and more reliable.

Its products span content delivery, DDoS protection, zero trust security, application services, developer compute, and network connectivity.

### Product areas

- CDN and application performance
- Web application and API security
- Zero trust access
- Developer platform services
- Network and infrastructure protection`,
    foundingYear: 2009,
    numberOfEmployees: 3600,
    address: '101 Townsend St, San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://www.cloudflare.com',
  },
  {
    name: 'Datadog',
    taxId: 'RS-927614358',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Observability and security platform for cloud applications.',
    description: `## Observability for modern systems

Datadog provides monitoring, observability, and security products that help engineering and operations teams understand distributed systems in production.

Teams use Datadog to collect metrics, traces, logs, user experience signals, cloud security findings, and application performance data in one platform.

### Product areas

- Infrastructure monitoring
- Application performance monitoring
- Log management
- Security monitoring
- Real user monitoring and synthetic tests`,
    foundingYear: 2010,
    numberOfEmployees: 5200,
    address: '620 8th Ave, New York, NY, USA',
    logoUrl: null,
    websiteUrl: 'https://www.datadoghq.com',
  },
  {
    name: 'Doctolib',
    taxId: 'RS-510936284',
    approvalStatus: COMPANY_APPROVAL_STATUS.PENDING_APPROVAL,
    shortDescription: 'Digital health platform for booking appointments and managing care workflows.',
    description: `## Digital tools for healthcare access

Doctolib builds products that help patients book healthcare appointments and help healthcare professionals manage schedules, communication, and practice workflows.

The platform focuses on improving access to care and reducing administrative load for medical teams.

### Product areas

- Online appointment booking
- Patient communication
- Practice management workflows
- Telehealth and care coordination
- Tools for healthcare professionals`,
    foundingYear: 2013,
    numberOfEmployees: 2800,
    address: '54 Quai Charles Pasqua, Levallois-Perret, France',
    logoUrl: null,
    websiteUrl: 'https://www.doctolib.fr',
  },
  {
    name: 'Shopify',
    taxId: 'RS-318475920',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Commerce platform for online stores, retail operations, payments, and fulfillment.',
    description: `## Commerce operating system

Shopify provides software and services that help merchants create online stores, sell across channels, accept payments, manage operations, and grow commerce businesses.

Its platform supports entrepreneurs, retailers, and large brands across storefronts, point of sale, checkout, payments, marketing, and analytics.

### Product areas

- Online storefronts and checkout
- Retail point of sale
- Payments and financial tools
- Merchant analytics
- Developer and partner ecosystem`,
    foundingYear: 2006,
    numberOfEmployees: 7600,
    address: '151 OConnor St, Ottawa, ON, Canada',
    logoUrl: null,
    websiteUrl: 'https://www.shopify.com',
  },
  {
    name: 'GitLab',
    taxId: 'RS-846205731',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'DevSecOps platform for source control, CI/CD, security, and software delivery.',
    description: `## DevSecOps in one platform

GitLab provides a software delivery platform that brings planning, source code management, CI/CD, security testing, and deployment workflows into one application.

Engineering teams use GitLab to collaborate on code, automate pipelines, review changes, scan for vulnerabilities, and manage software delivery.

### Product areas

- Source code management
- Continuous integration and delivery
- Security scanning
- Planning and issue tracking
- Release and deployment workflows`,
    foundingYear: 2014,
    numberOfEmployees: 2100,
    address: '268 Bush St, San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://about.gitlab.com',
  },
  {
    name: 'Atlassian',
    taxId: 'RS-740193625',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Collaboration software company for planning, service management, and software teams.',
    description: `## Team collaboration software

Atlassian builds products that help software, IT, and business teams plan work, collaborate, ship releases, and support customers.

### Product areas

- Jira planning and project tracking
- Confluence knowledge sharing
- Bitbucket developer workflows
- Jira Service Management
- Enterprise administration and analytics`,
    foundingYear: 2002,
    numberOfEmployees: 12000,
    address: '341 George St, Sydney, NSW, Australia',
    logoUrl: null,
    websiteUrl: 'https://www.atlassian.com',
  },
  {
    name: 'Figma',
    taxId: 'RS-693845217',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Collaborative design platform for product teams building digital experiences.',
    description: `## Collaborative product design

Figma builds browser-based design, prototyping, whiteboarding, and developer handoff tools used by product teams.

### Product areas

- Interface design and prototyping
- Design systems
- FigJam collaboration
- Dev Mode handoff
- Team administration`,
    foundingYear: 2012,
    numberOfEmployees: 1600,
    address: '760 Market St, San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://www.figma.com',
  },
  {
    name: 'Notion',
    taxId: 'RS-582014936',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Connected workspace for notes, docs, projects, knowledge, and lightweight workflows.',
    description: `## Connected workspace

Notion builds flexible tools for documentation, project tracking, knowledge management, and collaboration across teams.

### Product areas

- Docs and knowledge bases
- Project and task management
- Databases and workflow templates
- Calendar and team planning
- AI-assisted writing and search`,
    foundingYear: 2016,
    numberOfEmployees: 1200,
    address: '548 Market St, San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://www.notion.so',
  },
  {
    name: 'Airbnb',
    taxId: 'RS-461802735',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Travel marketplace connecting guests with hosts and unique stays worldwide.',
    description: `## Travel marketplace

Airbnb builds products for discovering stays, hosting guests, managing trust and safety, and operating a global marketplace.

### Product areas

- Guest search and booking
- Host tools
- Payments and risk systems
- Trust and safety
- Mobile travel experiences`,
    foundingYear: 2008,
    numberOfEmployees: 6900,
    address: '888 Brannan St, San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://www.airbnb.com',
  },
  {
    name: 'Vercel',
    taxId: 'RS-215709483',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Frontend cloud platform for building, deploying, and scaling web applications.',
    description: `## Frontend cloud platform

Vercel provides infrastructure and developer tools for teams building modern web applications with a focus on performance, collaboration, and reliable global delivery.

### Product areas

- Web application deployment
- Edge compute and delivery
- Developer workflow automation
- Preview environments
- Frontend observability`,
    foundingYear: 2015,
    numberOfEmployees: 650,
    address: '340 S Lemon Ave, Walnut, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://vercel.com',
  },
  {
    name: 'Linear',
    taxId: 'RS-368142750',
    approvalStatus: COMPANY_APPROVAL_STATUS.APPROVED,
    shortDescription: 'Product development platform for planning, tracking, and delivering software.',
    description: `## Product development system

Linear builds planning and issue-tracking tools that help product and engineering teams organize roadmaps, projects, incidents, and day-to-day software delivery.

### Product areas

- Issue and project tracking
- Product roadmaps
- Engineering workflows
- Team planning
- Workflow integrations`,
    foundingYear: 2019,
    numberOfEmployees: 180,
    address: 'San Francisco, CA, USA',
    logoUrl: null,
    websiteUrl: 'https://linear.app',
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
    key: 'recruiterAtlassian',
    name: 'Tara Recruiter',
    email: 'tara.recruiter+seed@careerscope.local',
    firstName: 'Tara',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1987-02-22',
    companyTaxId: 'RS-740193625',
  },
  {
    key: 'recruiterFigma',
    name: 'Ognjen Recruiter',
    email: 'ognjen.recruiter+seed@careerscope.local',
    firstName: 'Ognjen',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1993-01-17',
    companyTaxId: 'RS-693845217',
  },
  {
    key: 'recruiterNotion',
    name: 'Marija Recruiter',
    email: 'marija.recruiter+seed@careerscope.local',
    firstName: 'Marija',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1991-05-26',
    companyTaxId: 'RS-582014936',
  },
  {
    key: 'recruiterAirbnb',
    name: 'Filip Recruiter',
    email: 'filip.recruiter+seed@careerscope.local',
    firstName: 'Filip',
    lastName: 'Recruiter',
    role: USER_ROLE.RECRUITER,
    dateOfBirth: '1985-07-07',
    companyTaxId: 'RS-461802735',
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
  {
    key: 'candidateLazar',
    name: 'Lazar Candidate',
    email: 'lazar.candidate+seed@careerscope.local',
    firstName: 'Lazar',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1993-08-12',
  },
  {
    key: 'candidateMina',
    name: 'Mina Candidate',
    email: 'mina.candidate+seed@careerscope.local',
    firstName: 'Mina',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1996-10-03',
  },
  {
    key: 'candidateUros',
    name: 'Uros Candidate',
    email: 'uros.candidate+seed@careerscope.local',
    firstName: 'Uros',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1992-06-21',
  },
  {
    key: 'candidateKatarina',
    name: 'Katarina Candidate',
    email: 'katarina.candidate+seed@careerscope.local',
    firstName: 'Katarina',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1998-01-28',
  },
  {
    key: 'candidateAleksa',
    name: 'Aleksa Candidate',
    email: 'aleksa.candidate+seed@careerscope.local',
    firstName: 'Aleksa',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1995-03-14',
  },
  {
    key: 'candidateTamara',
    name: 'Tamara Candidate',
    email: 'tamara.candidate+seed@careerscope.local',
    firstName: 'Tamara',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1997-08-09',
  },
  {
    key: 'candidateVuk',
    name: 'Vuk Candidate',
    email: 'vuk.candidate+seed@careerscope.local',
    firstName: 'Vuk',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1993-12-18',
  },
  {
    key: 'candidateLena',
    name: 'Lena Candidate',
    email: 'lena.candidate+seed@careerscope.local',
    firstName: 'Lena',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1998-04-25',
  },
  {
    key: 'candidateDusan',
    name: 'Dusan Candidate',
    email: 'dusan.candidate+seed@careerscope.local',
    firstName: 'Dusan',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1994-09-07',
  },
  {
    key: 'candidateSofija',
    name: 'Sofija Candidate',
    email: 'sofija.candidate+seed@careerscope.local',
    firstName: 'Sofija',
    lastName: 'Candidate',
    role: USER_ROLE.CANDIDATE,
    dateOfBirth: '1999-06-11',
  },
] as const;

const candidateSkills = [
  { userKey: 'candidatePetar', skillSlug: 'typescript', yearsOfExperience: 4 },
  { userKey: 'candidatePetar', skillSlug: 'reactjs', yearsOfExperience: 4 },
  { userKey: 'candidatePetar', skillSlug: 'nodejs', yearsOfExperience: 3 },
  { userKey: 'candidatePetar', skillSlug: 'postgresql', yearsOfExperience: 2 },
  { userKey: 'candidatePetar', skillSlug: 'swift', yearsOfExperience: 1 },
  { userKey: 'candidatePetar', skillSlug: 'product-management', yearsOfExperience: 2 },
  { userKey: 'candidateAna', skillSlug: 'python', yearsOfExperience: 5 },
  { userKey: 'candidateAna', skillSlug: 'postgresql', yearsOfExperience: 4 },
  { userKey: 'candidateAna', skillSlug: 'docker', yearsOfExperience: 3 },
  { userKey: 'candidateAna', skillSlug: 'aws', yearsOfExperience: 2 },
  { userKey: 'candidateAna', skillSlug: 'swift', yearsOfExperience: 1 },
  { userKey: 'candidateAna', skillSlug: 'user-research', yearsOfExperience: 2 },
  { userKey: 'candidateJovana', skillSlug: 'ui-ux-design', yearsOfExperience: 4 },
  { userKey: 'candidateJovana', skillSlug: 'figma', yearsOfExperience: 4 },
  { userKey: 'candidateJovana', skillSlug: 'user-research', yearsOfExperience: 3 },
  { userKey: 'candidateJovana', skillSlug: 'prototyping', yearsOfExperience: 3 },
  { userKey: 'candidateNikola', skillSlug: 'java', yearsOfExperience: 5 },
  { userKey: 'candidateNikola', skillSlug: 'springboot', yearsOfExperience: 4 },
  { userKey: 'candidateNikola', skillSlug: 'microservices-architecture', yearsOfExperience: 3 },
  { userKey: 'candidateNikola', skillSlug: 'apache-kafka', yearsOfExperience: 2 },
  { userKey: 'candidateNikola', skillSlug: 'postgresql', yearsOfExperience: 4 },
  { userKey: 'candidateNikola', skillSlug: 'product-management', yearsOfExperience: 2 },
  { userKey: 'candidateNikola', skillSlug: 'user-research', yearsOfExperience: 1 },
  { userKey: 'candidateMilica', skillSlug: 'reactjs', yearsOfExperience: 3 },
  { userKey: 'candidateMilica', skillSlug: 'typescript', yearsOfExperience: 3 },
  { userKey: 'candidateMilica', skillSlug: 'css', yearsOfExperience: 4 },
  { userKey: 'candidateMilica', skillSlug: 'design-systems', yearsOfExperience: 2 },
  { userKey: 'candidateMilica', skillSlug: 'playwright', yearsOfExperience: 2 },
  { userKey: 'candidateMilica', skillSlug: 'swift', yearsOfExperience: 1 },
  { userKey: 'candidateStefan', skillSlug: 'aws', yearsOfExperience: 5 },
  { userKey: 'candidateStefan', skillSlug: 'kubernetes', yearsOfExperience: 4 },
  { userKey: 'candidateStefan', skillSlug: 'infrastructure-as-code', yearsOfExperience: 3 },
  { userKey: 'candidateStefan', skillSlug: 'observability', yearsOfExperience: 4 },
  { userKey: 'candidateStefan', skillSlug: 'linux', yearsOfExperience: 6 },
  { userKey: 'candidateStefan', skillSlug: 'user-research', yearsOfExperience: 1 },
  { userKey: 'candidateTeodora', skillSlug: 'python', yearsOfExperience: 3 },
  { userKey: 'candidateTeodora', skillSlug: 'data-analysis', yearsOfExperience: 3 },
  { userKey: 'candidateTeodora', skillSlug: 'sql', yearsOfExperience: 3 },
  { userKey: 'candidateTeodora', skillSlug: 'data-visualization', yearsOfExperience: 2 },
  { userKey: 'candidateTeodora', skillSlug: 'business-intelligence', yearsOfExperience: 2 },
  { userKey: 'candidateTeodora', skillSlug: 'communication', yearsOfExperience: null },
  { userKey: 'candidateTeodora', skillSlug: 'product-management', yearsOfExperience: 2 },
  { userKey: 'candidateLazar', skillSlug: 'go', yearsOfExperience: 4 },
  { userKey: 'candidateLazar', skillSlug: 'distributed-systems', yearsOfExperience: 3 },
  { userKey: 'candidateLazar', skillSlug: 'apache-kafka', yearsOfExperience: 3 },
  { userKey: 'candidateLazar', skillSlug: 'postgresql', yearsOfExperience: 4 },
  { userKey: 'candidateLazar', skillSlug: 'web-security', yearsOfExperience: 2 },
  { userKey: 'candidateMina', skillSlug: 'product-management', yearsOfExperience: 4 },
  { userKey: 'candidateMina', skillSlug: 'project-management', yearsOfExperience: 4 },
  { userKey: 'candidateMina', skillSlug: 'user-research', yearsOfExperience: 3 },
  { userKey: 'candidateMina', skillSlug: 'communication', yearsOfExperience: null },
  { userKey: 'candidateMina', skillSlug: 'leadership', yearsOfExperience: 2 },
  { userKey: 'candidateUros', skillSlug: 'nextjs', yearsOfExperience: 3 },
  { userKey: 'candidateUros', skillSlug: 'reactjs', yearsOfExperience: 4 },
  { userKey: 'candidateUros', skillSlug: 'typescript', yearsOfExperience: 4 },
  { userKey: 'candidateUros', skillSlug: 'graphql-api-development', yearsOfExperience: 2 },
  { userKey: 'candidateUros', skillSlug: 'websockets', yearsOfExperience: 2 },
  { userKey: 'candidateKatarina', skillSlug: 'swift', yearsOfExperience: 3 },
  { userKey: 'candidateKatarina', skillSlug: 'ui-ux-design', yearsOfExperience: 2 },
  { userKey: 'candidateKatarina', skillSlug: 'figma', yearsOfExperience: 3 },
  { userKey: 'candidateKatarina', skillSlug: 'prototyping', yearsOfExperience: 2 },
  { userKey: 'candidateKatarina', skillSlug: 'communication', yearsOfExperience: null },
  { userKey: 'candidateAleksa', skillSlug: 'typescript', yearsOfExperience: 4 },
  { userKey: 'candidateAleksa', skillSlug: 'nodejs', yearsOfExperience: 4 },
  { userKey: 'candidateAleksa', skillSlug: 'postgresql', yearsOfExperience: 3 },
  { userKey: 'candidateAleksa', skillSlug: 'distributed-systems', yearsOfExperience: 2 },
  { userKey: 'candidateAleksa', skillSlug: 'debugging', yearsOfExperience: 4 },
  { userKey: 'candidateTamara', skillSlug: 'ui-ux-design', yearsOfExperience: 4 },
  { userKey: 'candidateTamara', skillSlug: 'figma', yearsOfExperience: 5 },
  { userKey: 'candidateTamara', skillSlug: 'design-systems', yearsOfExperience: 3 },
  { userKey: 'candidateTamara', skillSlug: 'prototyping', yearsOfExperience: 4 },
  { userKey: 'candidateTamara', skillSlug: 'user-research', yearsOfExperience: 3 },
  { userKey: 'candidateVuk', skillSlug: 'aws', yearsOfExperience: 4 },
  { userKey: 'candidateVuk', skillSlug: 'kubernetes', yearsOfExperience: 4 },
  { userKey: 'candidateVuk', skillSlug: 'docker', yearsOfExperience: 5 },
  { userKey: 'candidateVuk', skillSlug: 'infrastructure-as-code', yearsOfExperience: 3 },
  { userKey: 'candidateVuk', skillSlug: 'observability', yearsOfExperience: 3 },
  { userKey: 'candidateLena', skillSlug: 'product-management', yearsOfExperience: 4 },
  { userKey: 'candidateLena', skillSlug: 'data-analysis', yearsOfExperience: 3 },
  { userKey: 'candidateLena', skillSlug: 'sql', yearsOfExperience: 3 },
  { userKey: 'candidateLena', skillSlug: 'communication', yearsOfExperience: null },
  { userKey: 'candidateLena', skillSlug: 'project-management', yearsOfExperience: 3 },
  { userKey: 'candidateDusan', skillSlug: 'reactjs', yearsOfExperience: 4 },
  { userKey: 'candidateDusan', skillSlug: 'nextjs', yearsOfExperience: 3 },
  { userKey: 'candidateDusan', skillSlug: 'typescript', yearsOfExperience: 4 },
  { userKey: 'candidateDusan', skillSlug: 'frontend-development', yearsOfExperience: 4 },
  { userKey: 'candidateDusan', skillSlug: 'playwright', yearsOfExperience: 2 },
  { userKey: 'candidateSofija', skillSlug: 'playwright', yearsOfExperience: 3 },
  { userKey: 'candidateSofija', skillSlug: 'debugging', yearsOfExperience: 3 },
  { userKey: 'candidateSofija', skillSlug: 'typescript', yearsOfExperience: 2 },
  { userKey: 'candidateSofija', skillSlug: 'swift', yearsOfExperience: 3 },
  { userKey: 'candidateSofija', skillSlug: 'communication', yearsOfExperience: null },
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
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$120k - $160k',
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
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$110k - $150k',
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
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$85k - $115k',
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
    workLocation: 'Remote',
    employmentType: 'Contract',
    salaryRange: '$90k - $130k',
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

Shopify is creating a shared frontend platform for merchant, inventory, and operations products.

### What you will own

- Accessible React components and design tokens
- Frontend build tooling and performance budgets
- Testing patterns for critical commerce flows
- Documentation and migration guidance

You will work closely with product designers and feature teams.`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$100k - $140k',
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
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$115k - $155k',
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
    workLocation: 'OnSite',
    employmentType: 'FullTime',
    salaryRange: '$70k - $95k',
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
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$115k - $150k',
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
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$120k - $165k',
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
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$75k - $105k',
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
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$115k - $155k',
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
    workLocation: 'Hybrid',
    employmentType: 'Internship',
    salaryRange: '$45k - $60k',
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
  {
    title: 'Product Manager, Collaboration',
    companyTaxId: 'RS-740193625',
    createdByUserKey: 'recruiterAtlassian',
    shortDescription: 'Shape roadmap, discovery, and launch plans for collaboration products.',
    description: `## Lead collaboration product discovery

Own product discovery and delivery for tools used by distributed teams to plan work, document decisions, and coordinate launches.

### You will

- Define product strategy with design and engineering
- Run customer discovery and opportunity sizing
- Prioritize roadmap tradeoffs
- Partner with go-to-market teams
- Measure adoption, retention, and team productivity outcomes`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$125k - $170k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(48),
    skills: [
      { slug: 'product-management', yoe: 4 },
      { slug: 'project-management', yoe: 3 },
      { slug: 'user-research', yoe: 2 },
      { slug: 'communication', yoe: 3 },
      { slug: 'leadership', yoe: 2 },
    ],
  },
  {
    title: 'Design Systems Engineer',
    companyTaxId: 'RS-693845217',
    createdByUserKey: 'recruiterFigma',
    shortDescription: 'Build design-system infrastructure for product designers and frontend teams.',
    description: `## Build systems for design at scale

Work on component architecture, token workflows, accessibility tooling, and documentation for product teams using shared design systems.

### You will

- Build React components and design token pipelines
- Improve accessibility and interaction patterns
- Partner with designers on component APIs
- Document migration paths and usage guidelines
- Measure adoption across product surfaces`,
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$130k - $175k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(52),
    skills: [
      { slug: 'reactjs', yoe: 4 },
      { slug: 'typescript', yoe: 4 },
      { slug: 'design-systems', yoe: 3 },
      { slug: 'css', yoe: 3 },
      { slug: 'figma', yoe: 2 },
    ],
  },
  {
    title: 'Workspace Backend Engineer',
    companyTaxId: 'RS-582014936',
    createdByUserKey: 'recruiterNotion',
    shortDescription: 'Build APIs, permissions, and sync systems for collaborative workspaces.',
    description: `## Build collaborative workspace infrastructure

Design backend services for content permissions, database views, notifications, and real-time collaboration.

### You will

- Design APIs for flexible workspace objects
- Improve data modeling and permissions
- Build real-time collaboration services
- Optimize PostgreSQL query paths
- Improve reliability for high-traffic teams`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$135k - $180k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(62),
    skills: [
      { slug: 'nodejs', yoe: 4 },
      { slug: 'typescript', yoe: 4 },
      { slug: 'postgresql', yoe: 4 },
      { slug: 'websockets', yoe: 2 },
      { slug: 'system-design', yoe: 3 },
    ],
  },
  {
    title: 'iOS Product Engineer',
    companyTaxId: 'RS-461802735',
    createdByUserKey: 'recruiterAirbnb',
    shortDescription: 'Build mobile booking and host workflows for travelers and hosts.',
    description: `## Create mobile travel experiences

Build iOS product experiences across search, booking, guest messaging, and host operations.

### You will

- Ship Swift features across core travel flows
- Partner with design on polished interactions
- Improve experimentation and instrumentation
- Support accessibility and localization
- Collaborate with backend teams on APIs`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$125k - $165k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(44),
    skills: [
      { slug: 'swift', yoe: 3 },
      { slug: 'api-design', yoe: 2 },
      { slug: 'ui-ux-design', yoe: 2 },
      { slug: 'unit-testing', yoe: 2 },
      { slug: 'communication', yoe: 2 },
    ],
  },
  {
    title: 'Cloud Security Engineer',
    companyTaxId: 'RS-639027411',
    createdByUserKey: 'recruiterGreengrid',
    shortDescription: 'Protect cloud infrastructure through controls, detection, and secure automation.',
    description: `## Secure cloud platforms

Build guardrails, detection logic, and response workflows for cloud infrastructure used by product teams.

### You will

- Harden AWS and Kubernetes environments
- Improve identity and authorization controls
- Write detection rules for suspicious activity
- Automate remediation workflows
- Partner with platform engineers on threat modeling`,
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$125k - $170k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(58),
    skills: [
      { slug: 'aws', yoe: 4 },
      { slug: 'kubernetes', yoe: 3 },
      { slug: 'web-security', yoe: 3 },
      { slug: 'authorization', yoe: 2 },
      { slug: 'infrastructure-as-code', yoe: 3 },
    ],
  },
  {
    title: 'Revenue Data Engineer',
    companyTaxId: 'RS-782451006',
    createdByUserKey: 'recruiterAstra',
    shortDescription: 'Build reliable models and pipelines for revenue and payments analytics.',
    description: `## Model revenue data

Create trustworthy datasets for payments, billing, subscriptions, and financial reporting.

### You will

- Build data models and transformation pipelines
- Improve data quality monitoring
- Partner with finance and operations teams
- Document metric ownership
- Optimize warehouse query performance`,
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$105k - $145k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(38),
    skills: [
      { slug: 'sql', yoe: 4 },
      { slug: 'data-modeling', yoe: 3 },
      { slug: 'python', yoe: 3 },
      { slug: 'data-analysis', yoe: 3 },
      { slug: 'business-intelligence', yoe: 2 },
    ],
  },
  {
    title: 'Developer Experience Engineer',
    companyTaxId: 'RS-104582913',
    createdByUserKey: 'recruiterNorthstar',
    shortDescription: 'Improve SDKs, documentation, and workflows for cloud platform developers.',
    description: `## Improve developer experience

Build tools, examples, documentation, and CI workflows that help developers adopt platform APIs faster.

### You will

- Improve TypeScript SDK ergonomics
- Write practical guides and examples
- Build developer workflow tooling
- Measure friction in onboarding
- Collaborate with product and support teams`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$110k - $150k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(33),
    skills: [
      { slug: 'typescript', yoe: 4 },
      { slug: 'api-design', yoe: 3 },
      { slug: 'technical-documentation', yoe: 3 },
      { slug: 'nodejs', yoe: 3 },
      { slug: 'communication', yoe: 2 },
    ],
  },
  {
    title: 'Frontend Performance Engineer',
    companyTaxId: 'RS-318475920',
    createdByUserKey: 'recruiterDanube',
    shortDescription: 'Make storefront and checkout experiences faster across devices and regions.',
    description: `## Make commerce experiences faster

Improve frontend performance for high-traffic storefront, checkout, and merchant surfaces.

### You will

- Profile React rendering and bundle size
- Improve Core Web Vitals
- Build performance budgets into CI
- Partner with platform and product teams
- Document patterns for faster feature delivery`,
    workLocation: 'Remote',
    employmentType: 'Contract',
    salaryRange: '$95k - $135k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(26),
    skills: [
      { slug: 'reactjs', yoe: 4 },
      { slug: 'typescript', yoe: 3 },
      { slug: 'frontend-development', yoe: 4 },
      { slug: 'playwright', yoe: 2 },
      { slug: 'debugging', yoe: 3 },
    ],
  },
  {
    title: 'Developer Productivity Engineer',
    companyTaxId: 'RS-215709483',
    createdByUserKey: 'admin',
    shortDescription: 'Improve the local development, build, and debugging experience for product engineers.',
    description: `## Make product teams faster

Build tools and workflows that shorten feedback loops across local development, continuous integration, and production debugging.

### You will

- Improve TypeScript and Next.js development workflows
- Build reusable frontend tooling
- Reduce build and test feedback times
- Partner with engineers to identify recurring friction
- Document and measure developer productivity improvements`,
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$125k - $170k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(48),
    skills: [
      { slug: 'typescript', yoe: 4 },
      { slug: 'nextjs', yoe: 3 },
      { slug: 'reactjs', yoe: 3 },
      { slug: 'frontend-development', yoe: 4 },
      { slug: 'debugging', yoe: 3 },
    ],
  },
  {
    title: 'Product Operations Manager',
    companyTaxId: 'RS-368142750',
    createdByUserKey: 'admin',
    shortDescription: 'Create operating rhythms and insights that help product teams make better decisions.',
    description: `## Scale product operations

Build the processes, reporting, and feedback systems that connect product, design, engineering, and customer-facing teams.

### You will

- Coordinate planning and launch workflows
- Turn product data into actionable insights
- Improve customer feedback programs
- Maintain decision records and operating cadences
- Help teams communicate priorities and outcomes`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$100k - $140k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(41),
    skills: [
      { slug: 'product-management', yoe: 4 },
      { slug: 'project-management', yoe: 3 },
      { slug: 'data-analysis', yoe: 2 },
      { slug: 'communication', yoe: null },
      { slug: 'leadership', yoe: 2 },
    ],
  },
  {
    title: 'Observability Platform Engineer',
    companyTaxId: 'RS-927614358',
    createdByUserKey: 'admin',
    shortDescription: 'Build telemetry pipelines and platform capabilities for reliable cloud services.',
    description: `## Build the observability platform

Create scalable telemetry systems that help engineering teams understand and improve production services.

### You will

- Build metrics, logs, and tracing pipelines
- Operate services on Kubernetes and AWS
- Improve debugging workflows and incident context
- Design resilient distributed systems
- Partner with product teams on instrumentation standards`,
    workLocation: 'Remote',
    employmentType: 'FullTime',
    salaryRange: '$135k - $180k',
    status: JOB_POSTING_STATUS.ACTIVE,
    expiresAt: daysFromNow(55),
    skills: [
      { slug: 'observability', yoe: 4 },
      { slug: 'kubernetes', yoe: 3 },
      { slug: 'aws', yoe: 3 },
      { slug: 'distributed-systems', yoe: 3 },
      { slug: 'debugging', yoe: 3 },
    ],
  },
  {
    title: 'Staff Design Engineer',
    companyTaxId: 'RS-693845217',
    createdByUserKey: 'recruiterFigma',
    shortDescription: 'Bridge design and engineering to create polished, reusable product foundations.',
    description: `## Shape product quality at scale

Work across design and frontend engineering to turn interaction patterns into accessible, reusable systems.

### You will

- Prototype complex product interactions
- Evolve shared components and design tokens
- Partner with designers on technical feasibility
- Improve accessibility and visual consistency
- Communicate implementation guidance across teams`,
    workLocation: 'Hybrid',
    employmentType: 'FullTime',
    salaryRange: '$140k - $185k',
    status: JOB_POSTING_STATUS.PAUSED,
    expiresAt: daysFromNow(64),
    skills: [
      { slug: 'design-systems', yoe: 4 },
      { slug: 'figma', yoe: 4 },
      { slug: 'ui-ux-design', yoe: 4 },
      { slug: 'typescript', yoe: 2 },
      { slug: 'communication', yoe: null },
    ],
  },
] as const;

const applications = [
  {
    userKey: 'candidatePetar',
    jobTitle: 'Senior Fullstack Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
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
  { userKey: 'candidateJovana', jobTitle: 'Product Designer', status: JOB_APPLICATION_STATUS.HIRED },
  { userKey: 'candidateAna', jobTitle: 'DevOps Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  { userKey: 'candidatePetar', jobTitle: 'DevOps Engineer', status: JOB_APPLICATION_STATUS.REJECTED },
  {
    userKey: 'candidateMilica',
    jobTitle: 'Frontend Platform Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'Frontend Platform Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Senior Java Engineer',
    status: JOB_APPLICATION_STATUS.HIRED,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Backend Platform Engineer',
    status: JOB_APPLICATION_STATUS.REJECTED,
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Site Reliability Engineer',
    status: JOB_APPLICATION_STATUS.HIRED,
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
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
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
    status: JOB_APPLICATION_STATUS.HIRED,
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
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  { userKey: 'candidateLazar', jobTitle: 'Security Software Engineer', status: JOB_APPLICATION_STATUS.HIRED },
  { userKey: 'candidateLazar', jobTitle: 'Cloud Security Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  { userKey: 'candidateLazar', jobTitle: 'Workspace Backend Engineer', status: JOB_APPLICATION_STATUS.SUBMITTED },
  { userKey: 'candidateMina', jobTitle: 'Product Manager, Collaboration', status: JOB_APPLICATION_STATUS.INTERVIEWING },
  { userKey: 'candidateMina', jobTitle: 'Data Analyst', status: JOB_APPLICATION_STATUS.REJECTED },
  { userKey: 'candidateMina', jobTitle: 'Developer Experience Engineer', status: JOB_APPLICATION_STATUS.SUBMITTED },
  { userKey: 'candidateUros', jobTitle: 'Design Systems Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  { userKey: 'candidateUros', jobTitle: 'Workspace Backend Engineer', status: JOB_APPLICATION_STATUS.HIRED },
  { userKey: 'candidateUros', jobTitle: 'Frontend Performance Engineer', status: JOB_APPLICATION_STATUS.SUBMITTED },
  { userKey: 'candidateKatarina', jobTitle: 'iOS Product Engineer', status: JOB_APPLICATION_STATUS.INTERVIEWING },
  { userKey: 'candidateKatarina', jobTitle: 'Junior Product Designer', status: JOB_APPLICATION_STATUS.SUBMITTED },
  { userKey: 'candidateKatarina', jobTitle: 'Design Systems Engineer', status: JOB_APPLICATION_STATUS.REJECTED },
  { userKey: 'candidateAna', jobTitle: 'Revenue Data Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  { userKey: 'candidateTeodora', jobTitle: 'Revenue Data Engineer', status: JOB_APPLICATION_STATUS.HIRED },
  { userKey: 'candidatePetar', jobTitle: 'Developer Experience Engineer', status: JOB_APPLICATION_STATUS.INTERVIEWING },
  { userKey: 'candidateMilica', jobTitle: 'Design Systems Engineer', status: JOB_APPLICATION_STATUS.SUBMITTED },
  { userKey: 'candidateStefan', jobTitle: 'Cloud Security Engineer', status: JOB_APPLICATION_STATUS.HIRED },
  { userKey: 'candidateJovana', jobTitle: 'Product Manager, Collaboration', status: JOB_APPLICATION_STATUS.SUBMITTED },
  { userKey: 'candidateNikola', jobTitle: 'Workspace Backend Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  { userKey: 'candidateTeodora', jobTitle: 'Product Manager, Collaboration', status: JOB_APPLICATION_STATUS.WITHDRAWN },
  {
    userKey: 'candidateAleksa',
    jobTitle: 'Developer Productivity Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  {
    userKey: 'candidateAleksa',
    jobTitle: 'Observability Platform Engineer',
    status: JOB_APPLICATION_STATUS.HIRED,
  },
  {
    userKey: 'candidateAleksa',
    jobTitle: 'Backend Platform Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateAleksa',
    jobTitle: 'Workspace Backend Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateTamara',
    jobTitle: 'Staff Design Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  { userKey: 'candidateTamara', jobTitle: 'Product Designer', status: JOB_APPLICATION_STATUS.HIRED },
  {
    userKey: 'candidateTamara',
    jobTitle: 'Junior Product Designer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateTamara',
    jobTitle: 'Product Operations Manager',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateVuk',
    jobTitle: 'Observability Platform Engineer',
    status: JOB_APPLICATION_STATUS.HIRED,
  },
  {
    userKey: 'candidateVuk',
    jobTitle: 'Cloud Security Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  { userKey: 'candidateVuk', jobTitle: 'DevOps Engineer', status: JOB_APPLICATION_STATUS.UNDER_REVIEW },
  {
    userKey: 'candidateVuk',
    jobTitle: 'Site Reliability Engineer',
    status: JOB_APPLICATION_STATUS.REJECTED,
  },
  {
    userKey: 'candidateLena',
    jobTitle: 'Product Operations Manager',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  { userKey: 'candidateLena', jobTitle: 'Data Analyst', status: JOB_APPLICATION_STATUS.HIRED },
  {
    userKey: 'candidateLena',
    jobTitle: 'Product Manager, Collaboration',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateLena',
    jobTitle: 'Revenue Data Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateDusan',
    jobTitle: 'Developer Productivity Engineer',
    status: JOB_APPLICATION_STATUS.HIRED,
  },
  {
    userKey: 'candidateDusan',
    jobTitle: 'Frontend Performance Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  {
    userKey: 'candidateDusan',
    jobTitle: 'Senior Fullstack Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateDusan',
    jobTitle: 'Design Systems Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidateSofija',
    jobTitle: 'QA Automation Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  {
    userKey: 'candidateSofija',
    jobTitle: 'iOS Product Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateSofija',
    jobTitle: 'Frontend Platform Engineer',
    status: JOB_APPLICATION_STATUS.REJECTED,
  },
  {
    userKey: 'candidateSofija',
    jobTitle: 'Developer Productivity Engineer',
    status: JOB_APPLICATION_STATUS.SUBMITTED,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'Observability Platform Engineer',
    status: JOB_APPLICATION_STATUS.REJECTED,
  },
  {
    userKey: 'candidateAna',
    jobTitle: 'Product Operations Manager',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  {
    userKey: 'candidateJovana',
    jobTitle: 'Staff Design Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Developer Productivity Engineer',
    status: JOB_APPLICATION_STATUS.INTERVIEWING,
  },
  { userKey: 'candidateMilica', jobTitle: 'Staff Design Engineer', status: JOB_APPLICATION_STATUS.HIRED },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Observability Platform Engineer',
    status: JOB_APPLICATION_STATUS.UNDER_REVIEW,
  },
] as const;

const applicationReviews = [
  {
    userKey: 'candidateJovana',
    jobTitle: 'Product Designer',
    rating: 5,
    comment: 'Clear process, fast feedback, and a thoughtful design challenge.',
    createdDaysAgo: 46,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'DevOps Engineer',
    rating: 3,
    comment: 'Useful screening call, but the role was more infrastructure-heavy than expected.',
    createdDaysAgo: 42,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Senior Java Engineer',
    rating: 5,
    comment: 'The interview covered architecture tradeoffs and gave a clear picture of the team.',
    createdDaysAgo: 37,
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Site Reliability Engineer',
    rating: 4,
    comment: 'Strong technical discussion and transparent expectations about on-call work.',
    createdDaysAgo: 33,
  },
  {
    userKey: 'candidateMilica',
    jobTitle: 'QA Automation Engineer',
    rating: 4,
    comment: 'Practical exercise, quick feedback, and a well-structured interview process.',
    createdDaysAgo: 29,
  },
  {
    userKey: 'candidateNikola',
    jobTitle: 'Backend Platform Engineer',
    rating: 3,
    comment: 'The process was professional, although the final feedback could have been more detailed.',
    createdDaysAgo: 27,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'Senior Fullstack Engineer',
    rating: 4,
    comment: 'The recruiter explained the team structure clearly and kept every interview step well organized.',
    createdDaysAgo: 25,
  },
  {
    userKey: 'candidateAna',
    jobTitle: 'Data Analyst',
    rating: 2,
    comment: 'The role changed during the process and the expected scope was not communicated early enough.',
    createdDaysAgo: 24,
  },
  {
    userKey: 'candidateJovana',
    jobTitle: 'Frontend Platform Engineer',
    rating: 4,
    comment: 'Thoughtful interviewers and useful feedback even though I was not selected for the role.',
    createdDaysAgo: 23,
  },
  {
    userKey: 'candidateStefan',
    jobTitle: 'Cloud Security Engineer',
    rating: 5,
    comment: 'Excellent security discussions, realistic scenarios, and a transparent explanation of the responsibilities.',
    createdDaysAgo: 22,
  },
  {
    userKey: 'candidateTeodora',
    jobTitle: 'Revenue Data Engineer',
    rating: 4,
    comment: 'The data exercise reflected the actual work and the team shared clear evaluation criteria.',
    createdDaysAgo: 20,
  },
  {
    userKey: 'candidateLazar',
    jobTitle: 'Security Software Engineer',
    rating: 5,
    comment: 'A demanding but fair technical process with responsive recruiters and strong engineering conversations.',
    createdDaysAgo: 19,
  },
  {
    userKey: 'candidateMina',
    jobTitle: 'Data Analyst',
    rating: 3,
    comment: 'The process was efficient, though more context before the analytical exercise would have helped.',
    createdDaysAgo: 18,
  },
  {
    userKey: 'candidateUros',
    jobTitle: 'Workspace Backend Engineer',
    rating: 5,
    comment: 'Collaborative system-design interviews and quick communication made this a very positive experience.',
    createdDaysAgo: 17,
  },
  {
    userKey: 'candidateKatarina',
    jobTitle: 'Design Systems Engineer',
    rating: 4,
    comment: 'The portfolio discussion was respectful and the rejection feedback was specific and actionable.',
    createdDaysAgo: 16,
  },
  {
    userKey: 'candidateTamara',
    jobTitle: 'Product Designer',
    rating: 5,
    comment: 'The design challenge was relevant, the panel was welcoming, and decisions were communicated quickly.',
    createdDaysAgo: 15,
  },
  {
    userKey: 'candidateVuk',
    jobTitle: 'Site Reliability Engineer',
    rating: 3,
    comment: 'Strong technical questions, but scheduling between interview stages took longer than expected.',
    createdDaysAgo: 14,
  },
  {
    userKey: 'candidateLena',
    jobTitle: 'Data Analyst',
    rating: 4,
    comment: 'Clear expectations, practical questions, and a good balance between technical and product discussion.',
    createdDaysAgo: 13,
  },
  {
    userKey: 'candidateDusan',
    jobTitle: 'Developer Productivity Engineer',
    rating: 5,
    comment: 'The interviews focused on real developer problems and gave me a strong sense of the engineering culture.',
    createdDaysAgo: 12,
  },
  {
    userKey: 'candidateSofija',
    jobTitle: 'Frontend Platform Engineer',
    rating: 2,
    comment: 'The process was professional, but the technical assignment required more time than initially described.',
    createdDaysAgo: 11,
  },
  {
    userKey: 'candidatePetar',
    jobTitle: 'Observability Platform Engineer',
    rating: 4,
    comment: 'Detailed architecture discussion and prompt feedback made the process useful despite the final outcome.',
    createdDaysAgo: 10,
  },
  {
    userKey: 'candidateMilica',
    jobTitle: 'Staff Design Engineer',
    rating: 5,
    comment: 'A polished process with close collaboration between design and engineering throughout the interviews.',
    createdDaysAgo: 9,
  },
  {
    userKey: 'candidateAna',
    jobTitle: 'Product Operations Manager',
    rating: 4,
    comment: 'So far the conversations have been focused, friendly, and clear about what success in the role means.',
    createdDaysAgo: 8,
  },
  {
    userKey: 'candidateAleksa',
    jobTitle: 'Observability Platform Engineer',
    rating: 5,
    comment: 'The team shared realistic production challenges and gave thoughtful feedback after every conversation.',
    createdDaysAgo: 7,
  },
  {
    userKey: 'candidateVuk',
    jobTitle: 'Observability Platform Engineer',
    rating: 4,
    comment: 'Well-structured platform interviews with good communication and no unnecessary repetition between stages.',
    createdDaysAgo: 6,
  },
  {
    userKey: 'candidateTeodora',
    jobTitle: 'Product Manager, Collaboration',
    rating: 3,
    comment: 'Helpful conversations overall, although the product case could have been scoped more clearly.',
    createdDaysAgo: 5,
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
      title: 'Candidate hired',
      message: 'You were hired for the Product Designer role.',
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
      title: 'Candidate hired',
      message: 'You were hired for the Senior Java Engineer role.',
    },
  },
  {
    userKey: 'candidateStefan',
    payload: {
      type: 'application_status_changed',
      title: 'Candidate hired',
      message: 'You were hired for the Site Reliability Engineer role.',
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

type ActivityTemplateSeedRecord = {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
};

type UserKey = (typeof users)[number]['key'];
type JobSeed = (typeof jobs)[number];
type ApplicationSeed = (typeof applications)[number];

const isDirectHireApplication = (application: ApplicationSeed) =>
  application.userKey === 'candidateJovana' && application.jobTitle === 'Product Designer';

const applicationCreatedDaysAgo = [
  57, 57, 56, 54, 54, 54, 51, 49, 49, 45,
  45, 45, 45, 42, 39, 39, 36, 36, 36, 34,
  31, 31, 29, 25, 25, 25, 25, 25, 21, 18,
  18, 18, 15, 12, 12, 8, 8, 8, 5, 2,
] as const;

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

const getInterviewActivityTemplates = (job: JobSeed) => {
  const hasDesignFocus = job.skills.some((item) =>
    ['ui-ux-design', 'figma', 'design-systems', 'prototyping', 'user-research'].includes(item.slug),
  );
  const hasDataFocus = job.skills.some((item) =>
    ['sql', 'data-analysis', 'data-visualization', 'business-intelligence', 'machine-learning'].includes(item.slug),
  );
  const hasSecurityFocus = job.skills.some((item) => ['web-security', 'authorization'].includes(item.slug));
  const hasProductFocus = job.skills.some((item) =>
    ['product-management', 'project-management', 'leadership'].includes(item.slug),
  );

  const roleSpecificActivity = hasDesignFocus
    ? {
        title: 'Portfolio review',
        description: 'Review selected product work, design decisions, collaboration context, and tradeoffs.',
        isRequired: true,
      }
    : hasDataFocus
      ? {
          title: 'Analytics case study',
          description: 'Discuss a practical data problem, metric definitions, and communication of findings.',
          isRequired: true,
        }
      : hasSecurityFocus
        ? {
            title: 'Security scenario interview',
            description: 'Walk through threat modeling, detection, response, and secure implementation decisions.',
            isRequired: true,
          }
        : hasProductFocus
          ? {
              title: 'Product case interview',
              description: 'Explore discovery, prioritization, stakeholder alignment, and launch planning.',
              isRequired: true,
            }
          : {
              title: 'Technical interview',
              description: 'Discuss architecture, implementation tradeoffs, testing approach, and production experience.',
              isRequired: true,
            };

  return [
    {
      title: 'Recruiter screen',
      description: 'Initial conversation about role fit, motivation, availability, and compensation expectations.',
      orderIndex: 0,
      isRequired: true,
    },
    {
      ...roleSpecificActivity,
      orderIndex: 1,
    },
    {
      title: 'Team interview',
      description: 'Meet future teammates and discuss collaboration style, communication, and delivery habits.',
      orderIndex: 2,
      isRequired: true,
    },
    {
      title: 'Reference check',
      description: 'Optional final validation before offer preparation.',
      orderIndex: 3,
      isRequired: false,
    },
  ];
};

const getApplicationActivityStatus = (
  application: ApplicationSeed,
  orderIndex: number,
): (typeof JOB_APPLICATION_ACTIVITY_STATUS)[keyof typeof JOB_APPLICATION_ACTIVITY_STATUS] => {
  switch (application.status) {
    case JOB_APPLICATION_STATUS.HIRED:
      return !isDirectHireApplication(application) && orderIndex <= 2
        ? JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED
        : JOB_APPLICATION_ACTIVITY_STATUS.PENDING;
    case JOB_APPLICATION_STATUS.REJECTED:
      return JOB_APPLICATION_ACTIVITY_STATUS.PENDING;
    case JOB_APPLICATION_STATUS.INTERVIEWING:
      return orderIndex === 0
        ? JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED
        : orderIndex === 1
          ? JOB_APPLICATION_ACTIVITY_STATUS.SCHEDULED
          : JOB_APPLICATION_ACTIVITY_STATUS.PENDING;
    case JOB_APPLICATION_STATUS.UNDER_REVIEW:
    case JOB_APPLICATION_STATUS.WITHDRAWN:
      return JOB_APPLICATION_ACTIVITY_STATUS.PENDING;
    default:
      return JOB_APPLICATION_ACTIVITY_STATUS.PENDING;
  }
};

const getApplicationActivityDates = (
  status: (typeof JOB_APPLICATION_ACTIVITY_STATUS)[keyof typeof JOB_APPLICATION_ACTIVITY_STATUS],
  createdDaysAgo: number,
  orderIndex: number,
) => {
  if (status === JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED) {
    const completedAt = daysAgo(Math.max(1, createdDaysAgo - 2 - orderIndex * 4));

    return {
      scheduledAt: daysAgo(Math.max(1, createdDaysAgo - 3 - orderIndex * 4)),
      completedAt,
    };
  }

  if (status === JOB_APPLICATION_ACTIVITY_STATUS.SCHEDULED) {
    return {
      scheduledAt: daysFromNow(2 + orderIndex),
      completedAt: null,
    };
  }

  if (status === JOB_APPLICATION_ACTIVITY_STATUS.CANCELLED) {
    return {
      scheduledAt: daysAgo(Math.max(1, createdDaysAgo - 2 - orderIndex * 3)),
      completedAt: null,
    };
  }

  return {
    scheduledAt: null,
    completedAt: null,
  };
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
    await db.delete(jobApplicationHiringStage).where(inArray(jobApplicationHiringStage.jobApplicationId, applicationIds));
    await db.delete(applicationReview).where(inArray(applicationReview.jobApplicationId, applicationIds));
    await db.delete(applicationStatusHistory).where(inArray(applicationStatusHistory.jobApplicationId, applicationIds));
  }

  await db.delete(jobApplication).where(inArray(jobApplication.jobPostingId, jobIds));
  await db.delete(jobPostingHiringStage).where(inArray(jobPostingHiringStage.jobPostingId, jobIds));
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
  const activityTemplatesByJobTitle = new Map<string, ActivityTemplateSeedRecord[]>();

  await removeSeedJobs();

  for (const [jobIndex, item] of jobs.entries()) {
    const companyId = requireMapValue(companiesByTaxId, item.companyTaxId, 'company tax id');
    const createdAt = daysAgo(70 - jobIndex * 3);
    const [createdJob] = await db
      .insert(jobPosting)
      .values({
        companyId,
        title: item.title,
        shortDescription: item.shortDescription,
        description: expandJobDescription(item.description),
        workLocation: item.workLocation,
        employmentType: item.employmentType,
        salaryRange: item.salaryRange,
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

    const createdTemplates = await db
      .insert(jobPostingHiringStage)
      .values(
        getInterviewActivityTemplates(item).map((activity) => ({
          jobPostingId: createdJob.id,
          title: activity.title,
          description: activity.description,
          orderIndex: activity.orderIndex,
          isRequired: activity.isRequired,
          createdAt,
          updatedAt: daysAgo(Math.max(1, 20 - jobIndex)),
        })),
      )
      .returning({
        id: jobPostingHiringStage.id,
        title: jobPostingHiringStage.title,
        description: jobPostingHiringStage.description,
        orderIndex: jobPostingHiringStage.orderIndex,
      });

    activityTemplatesByJobTitle.set(item.title, createdTemplates);
  }

  return { jobByTitle, activityTemplatesByJobTitle };
};

const seedApplications = async (
  jobByTitle: Map<string, number>,
  activityTemplatesByJobTitle: Map<string, ActivityTemplateSeedRecord[]>,
  userByKey: Map<UserKey, string>,
) => {
  const companiesByTaxId = await getCompaniesByTaxId();
  const applicationByKey = new Map<string, ApplicationSeedRecord>();

  for (const [applicationIndex, item] of applications.entries()) {
    const jobSeed = jobs.find((job) => job.title === item.jobTitle);
    const createdDaysAgo = applicationCreatedDaysAgo[applicationIndex % applicationCreatedDaysAgo.length];
    const statusUpdatedDaysAgo = Math.max(1, createdDaysAgo - (applicationIndex % 4 === 0 ? 7 : applicationIndex % 3));

    if (!jobSeed) {
      throw new Error(`Missing seed job definition for application "${item.jobTitle}".`);
    }

    const [createdApplication] = await db
      .insert(jobApplication)
      .values({
        userId: requireMapValue(userByKey, item.userKey, 'seed user key'),
        jobPostingId: requireMapValue(jobByTitle, item.jobTitle, 'seed job title'),
        status: item.status,
        createdAt: daysAgo(createdDaysAgo),
        updatedAt: daysAgo(statusUpdatedDaysAgo),
      })
      .returning({ id: jobApplication.id });

    applicationByKey.set(`${item.userKey}:${item.jobTitle}`, {
      id: createdApplication.id,
      companyId: requireMapValue(companiesByTaxId, jobSeed.companyTaxId, 'company tax id'),
    });

    const statusSequence = (() => {
      switch (item.status) {
        case JOB_APPLICATION_STATUS.SUBMITTED:
          return [JOB_APPLICATION_STATUS.SUBMITTED];
        case JOB_APPLICATION_STATUS.UNDER_REVIEW:
          return [JOB_APPLICATION_STATUS.SUBMITTED, JOB_APPLICATION_STATUS.UNDER_REVIEW];
        case JOB_APPLICATION_STATUS.INTERVIEWING:
          return [
            JOB_APPLICATION_STATUS.SUBMITTED,
            JOB_APPLICATION_STATUS.UNDER_REVIEW,
            JOB_APPLICATION_STATUS.INTERVIEWING,
          ];
        case JOB_APPLICATION_STATUS.HIRED:
          return isDirectHireApplication(item)
            ? [JOB_APPLICATION_STATUS.SUBMITTED, JOB_APPLICATION_STATUS.UNDER_REVIEW, JOB_APPLICATION_STATUS.HIRED]
            : [
                JOB_APPLICATION_STATUS.SUBMITTED,
                JOB_APPLICATION_STATUS.UNDER_REVIEW,
                JOB_APPLICATION_STATUS.INTERVIEWING,
                JOB_APPLICATION_STATUS.HIRED,
              ];
        case JOB_APPLICATION_STATUS.REJECTED:
        case JOB_APPLICATION_STATUS.WITHDRAWN:
          return [JOB_APPLICATION_STATUS.SUBMITTED, JOB_APPLICATION_STATUS.UNDER_REVIEW, item.status];
      }
    })();

    await db.insert(applicationStatusHistory).values(
      statusSequence.map((status, statusIndex) => ({
        jobApplicationId: createdApplication.id,
        status,
        reason:
          statusIndex === 0
            ? 'Application submitted.'
            : status === JOB_APPLICATION_STATUS.HIRED
              ? 'Candidate hired.'
              : status === JOB_APPLICATION_STATUS.INTERVIEWING
                ? 'Candidate moved to interviewing.'
              : `Application moved to ${status}.`,
        createdAt: daysAgo(Math.max(0, createdDaysAgo - statusIndex * 3)),
      })),
    );

    const templates = requireMapValue(activityTemplatesByJobTitle, item.jobTitle, 'seed job activity templates');
    await db.insert(jobApplicationHiringStage).values(
      templates.map((template) => {
        const status = getApplicationActivityStatus(item, template.orderIndex);
        const activityDates = getApplicationActivityDates(status, createdDaysAgo, template.orderIndex);

        return {
          jobApplicationId: createdApplication.id,
          jobPostingHiringStageId: template.id,
          title: template.title,
          description: template.description,
          orderIndex: template.orderIndex,
          status,
          scheduledAt: activityDates.scheduledAt,
          completedAt: activityDates.completedAt,
          internalNote:
            status === JOB_APPLICATION_ACTIVITY_STATUS.COMPLETED
              ? 'Seeded activity completed for demo analytics and interview timeline views.'
              : status === JOB_APPLICATION_ACTIVITY_STATUS.SCHEDULED
                ? 'Seeded upcoming interview activity.'
                : null,
          createdAt: daysAgo(createdDaysAgo),
          updatedAt: activityDates.completedAt ?? daysAgo(Math.max(1, createdDaysAgo - template.orderIndex)),
        };
      }),
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
        createdAt: daysAgo(item.createdDaysAgo),
        updatedAt: daysAgo(Math.max(0, item.createdDaysAgo - 1)),
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
  const { jobByTitle, activityTemplatesByJobTitle } = await seedJobs(userByKey);
  const applicationByKey = await seedApplications(jobByTitle, activityTemplatesByJobTitle, userByKey);
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
