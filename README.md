# FleetRent Pro

FleetRent Pro is a premium multi-tenant car rental and fleet management admin platform for Australian operators. This repository contains Phase 1 of the production-ready monorepo:

- `apps/admin-web`: Next.js 15 admin dashboard with responsive layout, grayscale design system, theme persistence, login flow, KPI dashboard, charts, and staff/settings entry routes.
- `apps/backend-api`: NestJS API with Prisma, PostgreSQL, tenant-aware auth base, JWT access and refresh tokens, RBAC permissions, audit logging, structured logging, throttled login endpoint, and health checks.
- `packages/shared-types`: Shared enums and auth payload types used across apps.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui style component setup
- TanStack Query and TanStack Table
- React Hook Form + Zod
- Recharts
- next-themes
- Framer Motion + GSAP
- NestJS
- Prisma ORM
- PostgreSQL + PostGIS
- Redis
- BullMQ
- Socket.IO
- AWS S3 SDK
- Sentry
- pino
- Docker Compose

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start local infrastructure if you are not using managed services:

```bash
docker compose up -d
```

3. Review environment files:

- `apps/admin-web/.env.local`
- `apps/backend-api/.env`
- `apps/admin-web/.env.example`
- `apps/backend-api/.env.example`

4. Generate Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Run the applications in separate terminals:

```bash
npm run dev:admin
npm run dev:api
```

## Default Seed Account

- Email: `admin@fleetrentpro.com`
- Password: `Admin@12345`

## Validation Commands

```bash
npm run typecheck -w @fleetrent/shared-types
npm run typecheck -w @fleetrent/admin-web
npm run typecheck -w @fleetrent/backend-api
npm run build -w @fleetrent/admin-web
npm run build -w @fleetrent/backend-api
```

## Phase 1 Coverage

- Monorepo structure with npm workspaces
- Responsive admin dashboard shell
- Light and dark theme persistence
- Authentication UI
- Tenant, branch, role, permission, user, refresh token, and audit log Prisma models
- JWT auth with refresh workflow
- RBAC guards and permission decorators
- Structured logging and baseline Sentry wiring
- Prisma migration and seed scripts

## Notes

- The managed Neon Postgres connection and managed Redis connection are already wired into the local backend `.env` file.
- `docker-compose.yml` is included for local Postgres/PostGIS and Redis when you want to run the stack without managed services.
- Later phases will extend this foundation with fleet CRUD, rentals, payments, maintenance, GPS tracking, reports, jobs, and automation.
