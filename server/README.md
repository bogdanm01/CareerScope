# CareerScope Server

Express API for CareerScope. The server uses PostgreSQL, Redis, Better Auth, Drizzle ORM, and local Docker services for development.

## Prerequisites

- Node.js matching `.nvmrc`
- npm
- Docker / OrbStack

Install dependencies:

```bash
npm install
```

## Environment

Local development reads `server/.env`.

Important database values:

```env
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5433
DRIZZLE_DATABASE_URL=postgresql://careerscope:careerscope@localhost:5433/careerscope
```

`POSTGRES_HOST=db` is correct for code running inside Docker. Commands run from the host machine should use `localhost:5433` or `DRIZZLE_DATABASE_URL`.

## Run local services

From `server/`:

```bash
docker compose -f local.compose.yaml up -d
```

This starts:

- API server on `http://localhost:3030`
- PostgreSQL exposed on `localhost:5433`
- Redis on `localhost:6379`
- Redis Insight on `http://localhost:5540`

Restart only the API container:

```bash
docker compose -f local.compose.yaml restart server
```

## Database migrations

Generate migrations from the current Drizzle schema:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

The migration config uses `DRIZZLE_DATABASE_URL`, so migrations run from the host through `localhost:5433`.

## Seeding data

Seeding is a two-step flow:

1. Create Better Auth users through the running API.
2. Seed application/domain data directly into PostgreSQL.

### 1. Seed auth users

Make sure the API server is running, then run:

```bash
npm run db:seed:auth
```

This calls:

```bash
POST http://localhost:3030/api/auth/sign-up/email
```

Default shared password:

```text
Password123!
```

Override values when needed:

```bash
BASE_URL=http://localhost:3030 \
CLIENT_ORIGIN=http://localhost:5173 \
SEED_PASSWORD='Password123!' \
npm run db:seed:auth
```

### 2. Seed dummy domain data

When running from the host machine, override the DB host and port:

```bash
POSTGRES_HOST=localhost POSTGRES_PORT=5433 npm run db:seed
```

This inserts or updates:

- companies
- user roles, onboarding status, and company assignments for seeded auth users
- candidate skills
- job postings
- required job posting skills
- applications
- application status history
- application reviews
- notifications

The dummy seed script expects the auth users from `db:seed:auth` to already exist. If they do not exist, the script will fail with a missing seed user error.

## Full local reset flow

For a fresh local database:

```bash
docker compose -f local.compose.yaml up -d
npm run db:migrate
npm run db:seed:auth
POSTGRES_HOST=localhost POSTGRES_PORT=5433 npm run db:seed
```

If you run commands inside the API container instead of the host, do not override `POSTGRES_HOST`; the Docker hostname `db` is available there.

## Development scripts

Run the API locally from the host:

```bash
npm run dev
```

Typecheck:

```bash
npx tsc --noEmit --skipLibCheck
```

Watch typecheck:

```bash
npm run typecheck:watch
```

## Useful database checks

List job posting columns:

```bash
docker exec server-db-1 psql -U careerscope -d careerscope \
  -c "select column_name, data_type from information_schema.columns where table_name = 'job_posting' order by ordinal_position;"
```

Check migration history:

```bash
docker exec server-db-1 psql -U careerscope -d careerscope \
  -c "select id, hash, created_at from drizzle.__drizzle_migrations order by id;"
```
