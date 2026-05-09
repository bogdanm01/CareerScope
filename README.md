# CareerScope

CareerScope is a job portal project built as a TypeScript monorepo. It contains a React client and an Express API server for job posting, company, recruiter, candidate, and authentication workflows.

The project is intended for a master's project scope: practical full-stack architecture, typed request validation, relational data modeling, authentication, and role-based API behavior without unnecessary platform complexity.

## Project Structure

```text
CareerScope/
  client/   React + Vite frontend
  server/   Express + Drizzle backend
```

## Tech Stack

### Client

- React
- TypeScript
- Vite
- Mantine UI
- React Router
- Jotai
- TipTap editor

### Server

- Node.js
- Express
- TypeScript
- Better Auth
- Drizzle ORM and Drizzle Kit
- PostgreSQL
- Redis
- Tsyringe dependency injection
- Zod validation
- Pino logging

## Main Features

- Email/password authentication with Better Auth.
- Role-aware API access for candidates, recruiters, and admins.
- Recruiter job posting management.
- Public active job posting browsing.
- Job posting status workflow with status history.
- Company-linked recruiter data.
- Skill and skill category data model.
- Request validation with Zod.
- PostgreSQL schema and migration support through Drizzle Kit.

## Environment

The server uses environment variables for database, Redis, Better Auth, and local port configuration. Create a `server/.env` file for local development.

The local Docker Compose setup in `server/local.compose.yaml` starts:

- API server
- PostgreSQL
- Redis
- Redis Insight

## API Overview

The backend is organized around route, controller, service, and repository layers:

- `routes` define HTTP endpoints and middleware.
- `controllers` adapt HTTP requests and responses.
- `services` contain business rules and validation.
- `repositories` contain database access.
- `data/schema` contains Drizzle table definitions.

Authentication routes are provided by Better Auth under `/api/auth`.

Current job posting APIs include public listing/detail access and protected recruiter/admin operations for creating, updating, deleting, and filtering job postings.

## Notes

This project is still evolving. Some business rules are intentionally kept simple while the core job portal workflow is being built out.
