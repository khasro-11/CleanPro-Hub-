# CLAUDE.md — CleanPro Hub Development Rules

## Project Context

- **Name:** CleanPro Hub
- **Owner:** CleanPro Reinigungsservice
- **Purpose:** Internal management & employee-tracking platform with an integrated AI agent. Handles customers, employees, jobs, scheduling, time-tracking, and reporting.
- **Audience:** Company admins + employees (German-speaking).
- **Status:** Active development. See `/docs/PHASES.md` for current phase.

---

## Always Do First (Every Session)

1. **Read `/prisma/schema.prisma`** before any DB, model, or type-related work. Never assume the schema — read it.
2. **Check `/components/ui/`** before creating any new UI component. Reuse and extend shadcn/ui — do not duplicate.
3. **Invoke the `frontend-design` skill** before writing any new UI / component code.
4. **Read `/docs/PHASES.md`** to confirm which phase is active and what's in scope.
5. **Run `npm run typecheck`** before claiming any task is "done". Zero errors = done.
6. **Never start a second dev server** if `localhost:3000` is already running.

---

## Tech Stack (verbindlich — keine Alternativen vorschlagen)

| Layer         | Tool                                                                 |
| ------------- | -------------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router) + TypeScript `strict: true`                  |
| Styling       | Tailwind CSS + shadcn/ui + Lucide icons                              |
| Forms         | React Hook Form + Zod                                                |
| Server state  | TanStack Query                                                       |
| Client state  | Zustand                                                              |
| DB            | PostgreSQL (Docker local) + Prisma ORM                               |
| Auth          | NextAuth v5 (Auth.js) — Credentials + Google OAuth                   |
| AI Agent      | `@anthropic-ai/sdk`, model `claude-sonnet-4-5`, streaming + tool-use |
| Dates         | `date-fns` with `de` locale                                          |
| Notifications | `sonner`                                                             |
| Charts        | `recharts`                                                           |

Do **not** introduce new dependencies without asking. If a problem can be solved with what's installed, solve it that way.

---

## Language Rules

- **Code, variables, function names, comments, commit messages, type names:** English.
- **All user-facing strings** (labels, buttons, errors, toasts, emails, validation messages, page titles): **German**.
- **URL slugs:** German — `/kunden`, `/mitarbeiter`, `/auftraege`, `/kalender`, `/berichte`.
- **DB tables:** English in Prisma model names; use `@@map` if German DB column names are ever needed (rarely).
- **Date format:** `dd.MM.yyyy` everywhere. Times: `HH:mm` (24h).
- **Currency:** German formatting — `1.234,56 €`. Use `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`.
- **Numbers:** German formatting — `Intl.NumberFormat('de-DE')`.

No mixing. A button labeled `Save` is a bug.

---

## File & Folder Conventions

```
/app
  /(auth)/login
  /(dashboard)/kunden, /mitarbeiter, /auftraege, /kalender, /berichte
  /api/customers, /employees, /jobs, /agent, /auth
/components
  /ui          → shadcn primitives, do not modify directly — extend
  /forms       → form components, one file per entity
  /tables      → data tables, sortable/filterable
  /agent       → chat UI, message list, tool-call cards
/lib
  /db          → Prisma client singleton
  /auth        → auth helpers, session getters
  /agent       → tool definitions, system prompt, runner
  /utils       → formatters (date, currency), validators
/prisma
  schema.prisma, seed.ts, migrations/
/types
  shared TS types & Zod schemas
```

- **One component per file.** Filename matches default export.
- **Components > 200 lines must be split.** No exceptions.
- **Business logic lives in `/lib`** — never in route handlers, never in components.
- **Zod schemas live in `/types` or co-located** as `xxx.schema.ts`. Reuse — don't redefine.

---

## Database Rules

- **Never edit `schema.prisma` without generating a migration**: `npx prisma migrate dev --name describe_change`.
- **Soft-delete only.** Use a `deletedAt DateTime?` column. Never hard-delete user-facing entities (Customer, Employee, Job).
- **Audit-log destructive or sensitive changes** to the `AuditLog` table: who, what, when, before/after.
- **Sensitive fields** (`Steuer-ID`, `Sozialversicherungsnummer`): encrypted at rest using a `lib/crypto.ts` helper. Never log them.
- **Every query through Prisma.** No raw SQL unless explicitly required and justified.
- **`createdAt` / `updatedAt`** on every table — `@default(now())` / `@updatedAt`.
- **Index foreign keys and frequently-filtered columns** (e.g. `status`, `deletedAt`).
- After schema changes: regenerate the client (`npx prisma generate`) and run `npm run typecheck`.

---

## API Rules

- **Every route validates input with Zod** before touching the DB. No exceptions.
- **Every route checks auth + authorization.** Authentication ≠ authorization. A logged-in `MITARBEITER` cannot access admin endpoints.
- **Standard response shape:**
  ```ts
  // success
  { ok: true, data: T }
  // error
  { ok: false, error: { code: string, message: string, details?: unknown } }
  ```
- **Never return raw Prisma errors to the client.** Catch, log server-side, return a safe message.
- **HTTP codes used correctly:** 200/201 success, 400 validation, 401 unauth, 403 forbidden, 404 not found, 409 conflict, 500 server.
- **Rate-limit auth endpoints** (`/api/auth/*`) — use `lib/rate-limit.ts`.
- **CSRF protection** stays enabled — do not disable.

---

## UI Rules

- **Use shadcn/ui first.** Need a button? `<Button>`. Need a dialog? `<Dialog>`. Don't rebuild primitives.
- **Forms:** always `react-hook-form` + `zodResolver`. Inline error messages in German. Disable submit while pending.
- **Tables:** sortable, filterable, paginated, with skeleton loaders. Empty states with illustration + CTA, never just blank.
- **Toasts** (`sonner`) for every meaningful action — success and error.
- **Loading states:** skeleton, never spinners on a blank page.
- **Confirmation dialogs** for any destructive action (delete, archive, bulk update).
- **Dark mode** must work for every new component. Test both themes.
- **Mobile-responsive** — sidebar collapses, tables become cards or scroll horizontally.
- **Accessibility:** every interactive element has hover, focus-visible, and active states. Forms are keyboard-navigable. Color contrast meets WCAG AA.

### Brand & Visuals (Anti-Generic Guardrails)

- **Primary color:** CleanPro brand color (see `brand_assets/colors.md`). Never default Tailwind blue/indigo.
- **Typography:** display font for headings, clean sans for body. Tight tracking (`-0.02em`) on large headings, line-height `1.6–1.7` on body copy.
- **Shadows:** layered, color-tinted, low opacity. No flat `shadow-md`.
- **Animations:** only `transform` and `opacity`. Never `transition-all`. Spring-style easing.
- **Depth:** layering system (base → elevated → floating), not all surfaces on the same plane.
- **Logo & assets:** check `brand_assets/` first. Use real assets, not placeholders, when available.

---

## Security Rules

- **No secrets in code.** All keys/tokens via `.env`. Update `.env.example` whenever you add a new env var.
- **Bcrypt** for password hashing (cost 12 minimum).
- **Session tokens** are httpOnly, secure, sameSite=lax.
- **Validate file uploads** (mime type, size) before storing. Photos: max 5MB, jpg/png/webp only.
- **Sanitize anything** rendered from user input that could be HTML.
- **Never log** passwords, tokens, Steuer-IDs, SV-Nrn., or full session data.

---

## AI Agent Rules

- **System prompt is in German** — the agent talks to German users in German.
- **Tool-use only for real actions.** Each tool maps to a single, well-scoped operation (`createCustomer`, `listEmployees`, `scheduleJob`, etc.).
- **Tool inputs validated with Zod** — same as API routes.
- **Streaming** responses to the chat UI. Show tool-call cards with loading → result state.
- **Confirmation required** before destructive tool calls (delete, archive, bulk operations) — agent must ask the user, then call.
- **Authorization respected.** A `MITARBEITER` chatting with the agent cannot trigger admin-only tools.
- **No silent failures.** If a tool errors, the agent reports it clearly to the user.
- **Token usage logged** per session for cost tracking — see `lib/agent/usage.ts`.

---

## Workflow

1. **Phase-by-phase.** Stick to the current phase in `/docs/PHASES.md`. Do not silently add features from later phases.
2. **At the end of each task:** run `npm run typecheck` and `npm run lint`. Both must pass before declaring done.
3. **At the end of each phase:** summarize what's built, what's tested, what's pending. Ask before starting the next phase.
4. **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Short imperative subject, body if needed.
5. **Migrations:** descriptive names (`add_employee_photo`, not `update_schema`).
6. **Ask, don't guess.** If a requirement is ambiguous, ask one focused question rather than make assumptions.

---

## Hard Rules (No Exceptions)

- ❌ No `any` types. Use `unknown` + narrow if truly necessary.
- ❌ No business logic in API route handlers or React components.
- ❌ No `transition-all`.
- ❌ No default Tailwind blue/indigo as a primary brand color.
- ❌ No English in user-facing UI strings.
- ❌ No hard-deletes on Customer, Employee, Job.
- ❌ No new dependencies without asking.
- ❌ No `console.log` left in committed code (use a proper logger).
- ❌ No skipping Zod validation "because it's an internal endpoint".
- ❌ No claiming a task is done before `typecheck` + `lint` pass.
