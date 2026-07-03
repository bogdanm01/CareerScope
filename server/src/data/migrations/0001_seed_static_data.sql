---- Custom SQL migration file, put your code below! --

INSERT INTO "skill_category" ("name", "slug", "description", "created_at", "updated_at")
VALUES
  ('Programming Languages', 'programming_language', 'Programming language proficiency and language-specific development skills', NOW(), NOW()),
  ('Frontend', 'frontend', 'Frontend frameworks, browser technologies, and user interface development', NOW(), NOW()),
  ('Backend', 'backend', 'Backend frameworks, server-side development, and API implementation', NOW(), NOW()),
  ('API', 'api', 'API design and integration skills', NOW(), NOW()),
  ('Database', 'database', 'Database systems, modeling, and data storage skills', NOW(), NOW()),
  ('Architecture', 'architecture', 'Software architecture and system design skills', NOW(), NOW()),
  ('Cloud', 'cloud', 'Cloud platforms and cloud-native services', NOW(), NOW()),
  ('DevOps', 'devops', 'Infrastructure, deployment, automation, and operations skills', NOW(), NOW()),
  ('Engineering Practices', 'engineering_practice', 'General software engineering practices and code quality skills', NOW(), NOW()),
  ('Testing', 'testing', 'Software testing and quality assurance skills', NOW(), NOW()),
  ('Security', 'security', 'Authentication, authorization, and web security skills', NOW(), NOW()),
  ('Realtime', 'realtime', 'Realtime communication and messaging skills', NOW(), NOW()),
  ('Observability', 'observability', 'Monitoring, logging, metrics, and tracing skills', NOW(), NOW()),
  ('Performance', 'performance', 'Performance analysis and optimization skills', NOW(), NOW()),
  ('Computer Science', 'computer_science', 'Core computer science concepts and fundamentals', NOW(), NOW()),
  ('Data', 'data', 'Data analysis, data platforms, and data engineering skills', NOW(), NOW()),
  ('AI / ML', 'ai_ml', 'Artificial intelligence and machine learning skills', NOW(), NOW()),
  ('Product', 'product', 'Product strategy and product management skills', NOW(), NOW()),
  ('Product Design', 'product_design', 'UX, UI, research, and product design skills', NOW(), NOW()),
  ('Tooling', 'tooling', 'Development and collaboration tools', NOW(), NOW()),
  ('Business', 'business', 'Business, leadership, communication, and delivery skills', NOW(), NOW()),
  ('Soft Skills', 'soft_skill', 'Interpersonal and professional soft skills', NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "skill" ("name", "description", "slug", "category_id", "created_at", "updated_at")
SELECT
  skill_data.name,
  skill_data.description,
  skill_data.slug,
  skill_category.id,
  NOW(),
  NOW()
FROM (
  VALUES
  ('JavaScript', 'JavaScript programming language proficiency', 'javascript', 'programming_language'),
  ('TypeScript', 'TypeScript programming language proficiency', 'typescript', 'programming_language'),
  ('Java', 'Java programming language proficiency', 'java', 'programming_language'),
  ('Kotlin', 'Kotlin programming language proficiency', 'kotlin', 'programming_language'),
  ('Python', 'Python programming language proficiency', 'python', 'programming_language'),
  ('C', 'C programming language proficiency', 'c', 'programming_language'),
  ('C++', 'C++ programming language proficiency', 'c-plus-plus', 'programming_language'),
  ('CSharp', 'C# programming language proficiency', 'csharp', 'programming_language'),
  ('Go', 'Go programming language proficiency', 'go', 'programming_language'),
  ('Rust', 'Rust programming language proficiency', 'rust', 'programming_language'),
  ('Swift', 'Swift programming language proficiency', 'swift', 'programming_language'),
  ('Objective-C', 'Objective-C programming language proficiency', 'objective-c', 'programming_language'),
  ('HTML', 'HTML markup language proficiency', 'html', 'frontend'),
  ('CSS', 'CSS styling and layout proficiency', 'css', 'frontend'),
  ('ReactJs', 'React.js frontend development proficiency', 'reactjs', 'frontend'),
  ('NextJs', 'Next.js framework proficiency', 'nextjs', 'frontend'),
  ('Angular', 'Angular framework proficiency', 'angular', 'frontend'),
  ('VueJs', 'Vue.js framework proficiency', 'vuejs', 'frontend'),
  ('Frontend Development', 'Building user interfaces and client-side applications', 'frontend-development', 'frontend'),
  ('NodeJs', 'Node.js backend development proficiency', 'nodejs', 'backend'),
  ('ExpressJs', 'Express.js backend framework proficiency', 'expressjs', 'backend'),
  ('NestJs', 'NestJS backend framework proficiency', 'nestjs', 'backend'),
  ('SpringBoot', 'Spring Boot framework proficiency', 'springboot', 'backend'),
  ('Django', 'Django web framework proficiency', 'django', 'backend'),
  ('Flask', 'Flask web framework proficiency', 'flask', 'backend'),
  ('DotNet', '.NET framework proficiency', 'dotnet', 'backend'),
  ('Backend Development', 'Building server-side logic and APIs', 'backend-development', 'backend'),
  ('Fullstack Development', 'Working across both frontend and backend systems', 'fullstack-development', 'backend'),
  ('REST API Development', 'Building RESTful APIs', 'rest-api-development', 'api'),
  ('GraphQL API Development', 'Designing and implementing GraphQL APIs', 'graphql-api-development', 'api'),
  ('API Design', 'Designing clean, scalable and maintainable APIs', 'api-design', 'api'),
  ('SQL', 'SQL and relational database proficiency', 'sql', 'database'),
  ('PostgreSQL', 'PostgreSQL database proficiency', 'postgresql', 'database'),
  ('MongoDB', 'MongoDB database proficiency', 'mongodb', 'database'),
  ('Redis', 'Redis caching and data store proficiency', 'redis', 'database'),
  ('Database Design', 'Designing relational and non-relational databases', 'database-design', 'database'),
  ('Data Modeling', 'Structuring and organizing data efficiently', 'data-modeling', 'database'),
  ('Software Architecture', 'Designing scalable and maintainable system architectures', 'software-architecture', 'architecture'),
  ('System Design', 'Designing distributed systems and high-level architectures', 'system-design', 'architecture'),
  ('Microservices Architecture', 'Designing and implementing microservices-based systems', 'microservices-architecture', 'architecture'),
  ('Monolithic Architecture', 'Designing and maintaining monolithic applications', 'monolithic-architecture', 'architecture'),
  ('Event-Driven Architecture', 'Designing systems based on events and messaging', 'event-driven-architecture', 'architecture'),
  ('Distributed Systems', 'Designing and working with distributed architectures', 'distributed-systems', 'architecture'),
  ('Scalability', 'Designing systems that scale under load', 'scalability', 'architecture'),
  ('Cloud Computing', 'Working with cloud infrastructure and services', 'cloud-computing', 'cloud'),
  ('AWS', 'Amazon Web Services cloud platform proficiency', 'aws', 'cloud'),
  ('Azure', 'Microsoft Azure cloud platform proficiency', 'azure', 'cloud'),
  ('Google Cloud', 'Google Cloud Platform services proficiency', 'google-cloud', 'cloud'),
  ('Firebase', 'Firebase platform proficiency', 'firebase', 'cloud'),
  ('Supabase', 'Supabase backend-as-a-service proficiency', 'supabase', 'cloud'),
  ('DevOps', 'CI/CD, automation and infrastructure management', 'devops', 'devops'),
  ('CI/CD Pipelines', 'Building and maintaining CI/CD pipelines', 'ci-cd-pipelines', 'devops'),
  ('Infrastructure as Code', 'Managing infrastructure using code', 'infrastructure-as-code', 'devops'),
  ('Containerization', 'Using containers for deployment', 'containerization', 'devops'),
  ('Docker', 'Docker containerization proficiency', 'docker', 'devops'),
  ('Kubernetes', 'Kubernetes orchestration proficiency', 'kubernetes', 'devops'),
  ('Linux', 'Linux operating system proficiency', 'linux', 'devops'),
  ('Nginx', 'Nginx web server configuration proficiency', 'nginx', 'devops'),
  ('Git', 'Git version control proficiency', 'git', 'engineering_practice'),
  ('Code Review', 'Reviewing and improving code quality', 'code-review', 'engineering_practice'),
  ('Clean Code', 'Writing readable and maintainable code', 'clean-code', 'engineering_practice'),
  ('Refactoring', 'Improving existing code without changing behavior', 'refactoring', 'engineering_practice'),
  ('Technical Documentation', 'Writing technical documentation', 'technical-documentation', 'engineering_practice'),
  ('Debugging', 'Identifying and fixing software issues', 'debugging', 'engineering_practice'),
  ('Problem Solving', 'Analyzing and solving problems', 'problem-solving', 'engineering_practice'),
  ('Unit Testing', 'Writing unit tests', 'unit-testing', 'testing'),
  ('Integration Testing', 'Testing component interactions', 'integration-testing', 'testing'),
  ('End-to-End Testing', 'Testing complete workflows', 'end-to-end-testing', 'testing'),
  ('Test Automation', 'Automating testing processes', 'test-automation', 'testing'),
  ('Manual Testing', 'Executing manual test cases', 'manual-testing', 'testing'),
  ('Quality Assurance', 'Ensuring software quality', 'quality-assurance', 'testing'),
  ('Jest', 'Jest testing framework proficiency', 'jest', 'testing'),
  ('Cypress', 'End-to-end testing with Cypress', 'cypress', 'testing'),
  ('Playwright', 'Modern E2E testing framework', 'playwright', 'testing'),
  ('Selenium', 'Browser automation testing', 'selenium', 'testing'),
  ('Authentication', 'Implementing authentication systems', 'authentication', 'security'),
  ('Authorization', 'Managing access control', 'authorization', 'security'),
  ('OAuth', 'OAuth-based authentication', 'oauth', 'security'),
  ('JWT', 'JSON Web Token usage', 'jwt', 'security'),
  ('Web Security', 'Protecting web applications', 'web-security', 'security'),
  ('Real-time Systems', 'Building real-time systems', 'real-time-systems', 'realtime'),
  ('WebSockets', 'Real-time communication', 'websockets', 'realtime'),
  ('Message Queues', 'Using messaging systems', 'message-queues', 'realtime'),
  ('Observability', 'Monitoring metrics, logs and traces', 'observability', 'observability'),
  ('Performance Optimization', 'Improving system performance', 'performance-optimization', 'performance'),
  ('Data Structures', 'Implementing data structures', 'data-structures', 'computer_science'),
  ('Algorithms', 'Applying algorithms', 'algorithms', 'computer_science'),
  ('Concurrency', 'Parallel execution and threading', 'concurrency', 'computer_science'),
  ('Memory Management', 'Memory optimization', 'memory-management', 'computer_science'),
  ('Operating Systems', 'OS fundamentals', 'operating-systems', 'computer_science'),
  ('Networking Basics', 'Networking fundamentals', 'networking-basics', 'computer_science'),
  ('Data Analysis', 'Analyzing data', 'data-analysis', 'data'),
  ('Data Visualization', 'Visualizing data', 'data-visualization', 'data'),
  ('Business Intelligence', 'Business data analysis', 'business-intelligence', 'data'),
  ('ETL', 'Data pipelines', 'etl', 'data'),
  ('Data Warehousing', 'Managing data warehouses', 'data-warehousing', 'data'),
  ('Big Data', 'Large-scale data systems', 'big-data', 'data'),
  ('Apache Kafka', 'Event streaming platform', 'apache-kafka', 'data'),
  ('Apache Spark', 'Data processing engine', 'apache-spark', 'data'),
  ('Machine Learning', 'Machine learning models', 'machine-learning', 'ai_ml'),
  ('Deep Learning', 'Neural networks', 'deep-learning', 'ai_ml'),
  ('Natural Language Processing', 'Text processing', 'natural-language-processing', 'ai_ml'),
  ('Computer Vision', 'Image processing', 'computer-vision', 'ai_ml'),
  ('MLOps', 'ML lifecycle management', 'mlops', 'ai_ml'),
  ('Product Management', 'Product planning and strategy', 'product-management', 'product'),
  ('UI/UX Design', 'User interface and experience design', 'ui-ux-design', 'product_design'),
  ('User Research', 'Understanding users', 'user-research', 'product_design'),
  ('Wireframing', 'UI layout creation', 'wireframing', 'product_design'),
  ('Prototyping', 'Interactive prototypes', 'prototyping', 'product_design'),
  ('Figma', 'Design tool', 'figma', 'product_design'),
  ('Design Systems', 'Reusable UI systems', 'design-systems', 'product_design'),
  ('Webpack', 'JS bundler', 'webpack', 'tooling'),
  ('Vite', 'Frontend build tool', 'vite', 'tooling'),
  ('Babel', 'JS transpiler', 'babel', 'tooling'),
  ('ESLint', 'Linting tool', 'eslint', 'tooling'),
  ('Prettier', 'Formatter', 'prettier', 'tooling'),
  ('Jira', 'Project tracking tool', 'jira', 'tooling'),
  ('Confluence', 'Documentation tool', 'confluence', 'tooling'),
  ('Postman', 'API tool', 'postman', 'tooling'),
  ('Project Management', 'Managing projects', 'project-management', 'business'),
  ('Stakeholder Management', 'Managing stakeholders', 'stakeholder-management', 'business'),
  ('Leadership', 'Leading teams', 'leadership', 'business'),
  ('Decision Making', 'Making decisions', 'decision-making', 'business'),
  ('Strategic Thinking', 'Long-term planning', 'strategic-thinking', 'business'),
  ('Customer Support', 'Supporting users', 'customer-support', 'business'),
  ('Sales Engineering', 'Technical sales support', 'sales-engineering', 'business'),
  ('Technical Writing', 'Writing technical content', 'technical-writing', 'business'),
  ('Communication', 'Effective communication', 'communication', 'soft_skill'),
  ('Teamwork', 'Working in teams', 'teamwork', 'soft_skill'),
  ('Adaptability', 'Adapting to change', 'adaptability', 'soft_skill'),
  ('Time Management', 'Managing time', 'time-management', 'soft_skill'),
  ('Critical Thinking', 'Logical thinking', 'critical-thinking', 'soft_skill'),
  ('Attention to Detail', 'Accuracy in work', 'attention-to-detail', 'soft_skill'),
  ('Ownership', 'Taking responsibility', 'ownership', 'soft_skill'),
  ('Proactivity', 'Taking initiative', 'proactivity', 'soft_skill'),
  ('Collaboration', 'Cross-team work', 'collaboration', 'soft_skill'),
  ('Conflict Resolution', 'Resolving conflicts', 'conflict-resolution', 'soft_skill'),
  ('Mentorship', 'Helping others grow', 'mentorship', 'soft_skill'),
  ('Learning Mindset', 'Continuous learning', 'learning-mindset', 'soft_skill'),
  ('Emotional Intelligence', 'Managing emotions', 'emotional-intelligence', 'soft_skill')
) AS skill_data(name, description, slug, category_slug)
JOIN "skill_category" ON "skill_category"."slug" = skill_data.category_slug
ON CONFLICT ("slug") DO NOTHING;

-- Keep skill YOE requirement flags aligned with the current model.
UPDATE "skill"
SET "requires_years_of_experience" = false
WHERE "category_id" IN (
  SELECT "id"
  FROM "skill_category"
  WHERE "slug" IN ('soft_skill')
);

-- Seed static companies used by local development and demo data.
INSERT INTO "company" (
  "name",
  "is_approved",
  "approval_status",
  "approval_rejection_reason",
  "approved_at",
  "tax_id",
  "short_description",
  "description",
  "founding_year",
  "number_of_employees",
  "address",
  "logo_url",
  "website_url",
  "is_deleted"
)
VALUES
  (
    'Microsoft',
    true,
    'Approved',
    NULL,
    NOW(),
    'RS-104582913',
    'Technology company building cloud, productivity, developer, and AI platforms.',
    $$## Technology platforms for work and development

Microsoft builds software, cloud infrastructure, developer tools, business applications, gaming products, and AI services used by organizations and consumers around the world.

### Product areas

- Azure cloud infrastructure and platform services
- Microsoft 365 productivity and collaboration tools
- GitHub and developer workflows
- Dynamics business applications
- Windows, Xbox, and consumer services

The company focuses on helping people and organizations be more productive through integrated software, cloud, and AI capabilities.$$,
    1975,
    221000,
    'One Microsoft Way, Redmond, WA, USA',
    NULL,
    'https://www.microsoft.com',
    false
  ),
  (
    'Stripe',
    true,
    'Approved',
    NULL,
    NOW(),
    'RS-782451006',
    'Financial infrastructure platform for online payments and business operations.',
    $$## Financial infrastructure for the internet

Stripe builds payment processing, billing, fraud prevention, tax, issuing, and financial workflow tools for businesses operating online and across platforms.

Its APIs and dashboard help companies accept payments, manage subscriptions, automate revenue operations, and launch marketplace or platform payment flows.

### Product areas

- Payments and checkout
- Billing and subscriptions
- Connect platform payments
- Radar fraud prevention
- Revenue and tax automation$$,
    2010,
    8500,
    '354 Oyster Point Blvd, South San Francisco, CA, USA',
    NULL,
    'https://stripe.com',
    false
  ),
  (
    'Cloudflare',
    true,
    'Approved',
    NULL,
    NOW(),
    'RS-639027411',
    'Connectivity cloud company for security, performance, and developer services.',
    $$## Connectivity cloud

Cloudflare provides a global network that helps organizations make websites, applications, APIs, and networks faster, safer, and more reliable.

Its products span content delivery, DDoS protection, zero trust security, application services, developer compute, and network connectivity.

### Product areas

- CDN and application performance
- Web application and API security
- Zero trust access
- Developer platform services
- Network and infrastructure protection$$,
    2009,
    3600,
    '101 Townsend St, San Francisco, CA, USA',
    NULL,
    'https://www.cloudflare.com',
    false
  ),
  (
    'Datadog',
    true,
    'Approved',
    NULL,
    NOW(),
    'RS-927614358',
    'Observability and security platform for cloud applications.',
    $$## Observability for modern systems

Datadog provides monitoring, observability, and security products that help engineering and operations teams understand distributed systems in production.

Teams use Datadog to collect metrics, traces, logs, user experience signals, cloud security findings, and application performance data in one platform.

### Product areas

- Infrastructure monitoring
- Application performance monitoring
- Log management
- Security monitoring
- Real user monitoring and synthetic tests$$,
    2010,
    5200,
    '620 8th Ave, New York, NY, USA',
    NULL,
    'https://www.datadoghq.com',
    false
  ),
  (
    'Doctolib',
    false,
    'PendingApproval',
    NULL,
    NULL,
    'RS-510936284',
    'Digital health platform for booking appointments and managing care workflows.',
    $$## Digital tools for healthcare access

Doctolib builds products that help patients book healthcare appointments and help healthcare professionals manage schedules, communication, and practice workflows.

The platform focuses on improving access to care and reducing administrative load for medical teams.

### Product areas

- Online appointment booking
- Patient communication
- Practice management workflows
- Telehealth and care coordination
- Tools for healthcare professionals$$,
    2013,
    2800,
    '54 Quai Charles Pasqua, Levallois-Perret, France',
    NULL,
    'https://www.doctolib.fr',
    false
  ),
  (
    'Shopify',
    true,
    'Approved',
    NULL,
    NOW(),
    'RS-318475920',
    'Commerce platform for online stores, retail operations, payments, and fulfillment.',
    $$## Commerce operating system

Shopify provides software and services that help merchants create online stores, sell across channels, accept payments, manage operations, and grow commerce businesses.

Its platform supports entrepreneurs, retailers, and large brands across storefronts, point of sale, checkout, payments, marketing, and analytics.

### Product areas

- Online storefronts and checkout
- Retail point of sale
- Payments and financial tools
- Merchant analytics
- Developer and partner ecosystem$$,
    2006,
    7600,
    '151 OConnor St, Ottawa, ON, Canada',
    NULL,
    'https://www.shopify.com',
    false
  ),
  (
    'GitLab',
    true,
    'Approved',
    NULL,
    NOW(),
    'RS-846205731',
    'DevSecOps platform for source control, CI/CD, security, and software delivery.',
    $$## DevSecOps in one platform

GitLab provides a software delivery platform that brings planning, source code management, CI/CD, security testing, and deployment workflows into one application.

Engineering teams use GitLab to collaborate on code, automate pipelines, review changes, scan for vulnerabilities, and manage software delivery.

### Product areas

- Source code management
- Continuous integration and delivery
- Security scanning
- Planning and issue tracking
- Release and deployment workflows$$,
    2014,
    2100,
    '268 Bush St, San Francisco, CA, USA',
    NULL,
    'https://about.gitlab.com',
    false
  )
ON CONFLICT ("tax_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "is_approved" = EXCLUDED."is_approved",
  "approval_status" = EXCLUDED."approval_status",
  "approval_rejection_reason" = EXCLUDED."approval_rejection_reason",
  "approved_at" = EXCLUDED."approved_at",
  "short_description" = EXCLUDED."short_description",
  "description" = EXCLUDED."description",
  "founding_year" = EXCLUDED."founding_year",
  "number_of_employees" = EXCLUDED."number_of_employees",
  "address" = EXCLUDED."address",
  "logo_url" = EXCLUDED."logo_url",
  "website_url" = EXCLUDED."website_url",
  "is_deleted" = EXCLUDED."is_deleted";
