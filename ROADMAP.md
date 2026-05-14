# CleanPro Hub — Roadmap & Setup Guide

## What Is This App?

CleanPro Hub is an internal management and employee-tracking platform for CleanPro Reinigungsservice.
It handles customers, employees, jobs, scheduling, time-tracking, and reporting — with an integrated AI agent coming in Phase 7.

**Target users:** Company admins + employees (German-speaking interface).

---

## Quick Start — First-Time Setup

### Prerequisites

- Node.js 20+
- Docker Desktop (running)
- Git

### 1. Clone & Install

```bash
git clone <repo-url>
cd CleanPro-Hub-
npm install
```

### 2. Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Minimum required values for local development:

```env
DATABASE_URL="postgresql://cleanpro:cleanpro_dev_password@localhost:5432/cleanpro_hub"
NEXTAUTH_SECRET="any-random-string-32-chars-or-more"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start the Database

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432`.

### 4. Run Migrations & Seed

```bash
npm run db:migrate   # applies all migrations
npm run db:seed      # loads demo data (customers, employees, jobs)
```

### 5. Start the Dev Server

```bash
npm run dev
```

App is now running at **http://localhost:3000**

---

## Login Accounts (Seed Data)

| Role        | E-Mail                            | Password          |
| ----------- | --------------------------------- | ----------------- |
| Admin       | `admin@cleanpro.de`               | `admin1234`       |
| Mitarbeiter | `anna.mueller@cleanpro.de`        | `mitarbeiter1234` |
| Mitarbeiter | `tom.schneider@cleanpro.de`       | `mitarbeiter1234` |

**Admin** has full access to all features and settings.
**Mitarbeiter** can log time, view their own jobs, and use the AI agent with restricted permissions.

---

## Useful Commands

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start dev server on http://localhost:3000        |
| `npm run build`       | Production build                                 |
| `npm run typecheck`   | TypeScript check — must pass before any PR       |
| `npm run lint`        | ESLint check — must pass before any PR           |
| `npm run db:migrate`  | Run pending Prisma migrations                    |
| `npm run db:seed`     | Re-seed demo data                                |
| `npm run db:generate` | Regenerate Prisma client after schema changes    |
| `npm run db:studio`   | Open Prisma Studio (visual DB browser)           |
| `docker compose up -d`| Start the PostgreSQL database container          |
| `docker compose down` | Stop the database container                      |

---

## App Structure

```
/app
  /(auth)/login          → Login page
  /(dashboard)
    /kunden              → Customer management
    /mitarbeiter         → Employee management
    /auftraege           → Job management
    /kalender            → Calendar view
    /berichte            → Reports
/components
  /ui                   → shadcn/ui primitives (do not modify directly)
  /forms                → One form component per entity
  /tables               → Sortable, filterable, paginated tables
  /agent                → AI chat UI (Phase 7)
/lib
  /db                   → Prisma client singleton
  /auth                 → Auth helpers, session utilities
  /agent                → AI agent tools, system prompt, runner
  /utils                → Date, currency formatters
/prisma
  schema.prisma         → Database schema (source of truth)
  seed.ts               → Demo data
  migrations/           → Migration history
/types                  → Shared TypeScript types + Zod schemas
/docs
  PHASES.md             → Phase tracker (current progress)
```

---

## Navigation

| Route           | What You'll Find                                        |
| --------------- | ------------------------------------------------------- |
| `/`             | Redirects to Dashboard                                  |
| `/login`        | Login page                                              |
| `/dashboard`    | KPI cards, charts, today's jobs, upcoming tasks         |
| `/kunden`       | Customer list — create, edit, soft-delete, filter       |
| `/mitarbeiter`  | Employee list — with status badges, photo, encrypted fields |
| `/auftraege`    | Job list — assign employees, set recurrence, track status |
| `/kalender`     | Weekly/monthly calendar view of all scheduled jobs      |
| `/berichte`     | Hour exports, revenue reports (CSV/PDF)                 |

---

## Demo Data (Loaded by Seed)

### Customers (5)

| Name                  | Type      | Contract          | Rate              |
| --------------------- | --------- | ----------------- | ----------------- |
| Hans Mustermann       | Privat    | Wöchentlich       | 28,00 €/Std.      |
| Sabine Weber          | Büro      | 2× monatlich      | 350,00 € Pauschale|
| Techpark Logistik     | Industrie | Wöchentlich       | 1.200,00 € Pauschale |
| Claudia Braun         | Privat    | Monatlich         | 26,00 €/Std.      |
| Stadtpraxis Dr. Klein | Büro      | Wöchentlich       | 450,00 € Pauschale|

### Employees (3)

| Name            | Contract  | Hours/Week | Wage        |
| --------------- | --------- | ---------- | ----------- |
| Anna Müller     | Vollzeit  | 40 h       | 15,50 €/Std.|
| Tom Schneider   | Teilzeit  | 25 h       | 14,00 €/Std.|
| Maria Gonzalez  | Minijob   | 15 h       | 13,50 €/Std.|

### Jobs (10)

10 jobs spread across the next week — a mix of recurring and one-off assignments, with one already completed (Claudia Braun) that includes a time entry.

---

## Development Phases

| Phase | Title                        | Status           |
| ----- | ---------------------------- | ---------------- |
| 1     | Project Setup & Auth         | ✅ Done          |
| 2     | Customer Management          | ✅ Done          |
| 3     | Employee Management          | ✅ Done          |
| 4     | Jobs & Calendar              | ✅ Done          |
| 5     | Time Tracking                | ✅ Done          |
| 6     | Dashboard & KPIs             | 🔄 In Progress   |
| 7     | AI Agent (Claude API)        | ⏳ Pending       |
| 8     | Polish (mobile, a11y, anim.) | ⏳ Pending       |

See [docs/PHASES.md](docs/PHASES.md) for detailed scope per phase.

---

## Key Rules for Contributors

- All user-facing text must be **German**. A button labeled "Save" is a bug.
- Dates: `dd.MM.yyyy`. Times: `HH:mm`. Currency: `1.234,56 €`.
- No `any` types. No `console.log` in committed code. No hard-deletes on Customer / Employee / Job.
- Every API route validates with Zod and checks auth + authorization.
- Run `npm run typecheck` and `npm run lint` before declaring any task done.
- Never start a second dev server if `localhost:3000` is already running.

---

## Planned Deployment (Phase 8+)

| Component  | Target                          |
| ---------- | ------------------------------- |
| Hosting    | Vercel (Next.js native)         |
| Database   | Supabase or Neon (PostgreSQL)   |
| File Uploads | Supabase Storage or AWS S3    |
