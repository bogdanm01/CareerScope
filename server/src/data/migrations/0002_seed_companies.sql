-- Custom SQL migration file, put your code below! --

INSERT INTO "company" (
  "name",
  "is_approved",
  "approved_at",
  "tax_id",
  "short_description",
  "description",
  "founding_year",
  "number_of_employees",
  "address",
  "logo_url",
  "website_url"
)
SELECT
  'Northstar Digital Labs',
  true,
  NOW(),
  'RS-104582913',
  'Product engineering studio for SaaS teams.',
  'Northstar Digital Labs builds web platforms, internal tools, and integration-heavy products for growing software companies.',
  2017,
  84,
  'Bulevar Mihajla Pupina 10, Belgrade, Serbia',
  'https://example.com/logos/northstar-digital-labs.png',
  'https://northstar-digital.example.com'
WHERE NOT EXISTS (SELECT 1 FROM "company" WHERE "tax_id" = 'RS-104582913');

INSERT INTO "company" (
  "name",
  "is_approved",
  "approved_at",
  "tax_id",
  "short_description",
  "description",
  "founding_year",
  "number_of_employees",
  "address",
  "logo_url",
  "website_url"
)
SELECT
  'AstraFin Systems',
  true,
  NOW(),
  'RS-782451006',
  'Fintech software and data infrastructure company.',
  'AstraFin Systems develops payment workflows, reporting services, and risk analytics products for regional finance teams.',
  2014,
  146,
  'Milutina Milankovica 9, Belgrade, Serbia',
  'https://example.com/logos/astrafin-systems.png',
  'https://astrafin.example.com'
WHERE NOT EXISTS (SELECT 1 FROM "company" WHERE "tax_id" = 'RS-782451006');

INSERT INTO "company" (
  "name",
  "is_approved",
  "approved_at",
  "tax_id",
  "short_description",
  "description",
  "founding_year",
  "number_of_employees",
  "address",
  "logo_url",
  "website_url"
)
SELECT
  'GreenGrid Cloud',
  true,
  NOW(),
  'RS-639027411',
  'Cloud operations and infrastructure automation provider.',
  'GreenGrid Cloud helps companies run reliable cloud infrastructure through managed Kubernetes, observability, and deployment automation.',
  2019,
  58,
  'Kneza Milosa 31, Belgrade, Serbia',
  'https://example.com/logos/greengrid-cloud.png',
  'https://greengrid.example.com'
WHERE NOT EXISTS (SELECT 1 FROM "company" WHERE "tax_id" = 'RS-639027411');

INSERT INTO "company" (
  "name",
  "is_approved",
  "approved_at",
  "tax_id",
  "short_description",
  "description",
  "founding_year",
  "number_of_employees",
  "address",
  "logo_url",
  "website_url"
)
SELECT
  'BluePeak HealthTech',
  false,
  NULL,
  'RS-510936284',
  'Healthcare scheduling and patient engagement startup.',
  'BluePeak HealthTech is building tools for clinics to manage patient communication, appointment workflows, and operational reporting.',
  2021,
  27,
  'Cara Dusana 45, Novi Sad, Serbia',
  'https://example.com/logos/bluepeak-healthtech.png',
  'https://bluepeak-health.example.com'
WHERE NOT EXISTS (SELECT 1 FROM "company" WHERE "tax_id" = 'RS-510936284');

INSERT INTO "company" (
  "name",
  "is_approved",
  "approved_at",
  "tax_id",
  "short_description",
  "description",
  "founding_year",
  "number_of_employees",
  "address",
  "logo_url",
  "website_url"
)
SELECT
  'OrbitWorks AI',
  true,
  NOW(),
  'RS-927614358',
  'Applied AI company focused on business automation.',
  'OrbitWorks AI creates document processing, workflow automation, and decision-support systems for operations-heavy organizations.',
  2020,
  39,
  'Vojvode Misica 12, Nis, Serbia',
  'https://example.com/logos/orbitworks-ai.png',
  'https://orbitworks.example.com'
WHERE NOT EXISTS (SELECT 1 FROM "company" WHERE "tax_id" = 'RS-927614358');
