# CleanPro Hub — Entwicklungsphasen

## Aktueller Stand

**Aktive Phase: Phase 5 — Zeiterfassung & Tracker**

---

## Phase 1 — Projektsetup & Auth ✅

**Status:** Abgeschlossen  
**Umfang:**
- Next.js 15+ App Router + TypeScript strict
- Tailwind CSS + shadcn/ui + Lucide Icons
- Docker Compose (PostgreSQL 16)
- Prisma Schema (User, Customer, Employee, Job, TimeEntry, Schedule, AuditLog, AgentUsage)
- NextAuth v5 mit Credentials Provider
- Middleware (Route-Schutz)
- Login-Seite (vollständig, deutsch)
- `lib/crypto.ts` für Verschlüsselung sensibler Felder
- `lib/rate-limit.ts` für Auth-Endpoints
- `lib/logger.ts` zentrales Logging
- Seed-Daten (5 Kunden, 3 Mitarbeiter, 10 Aufträge)
- `.env.example` + `docker-compose.yml`

---

## Phase 2 — Kundenverwaltung (CRUD + UI) ✅

**Status:** Abgeschlossen  
**Umfang:**
- Sidebar-Navigation (Dashboard, Kunden, Mitarbeiter, Aufträge, Kalender, Berichte)
- Header mit Suche, Benachrichtigungen, User-Menü
- Kunden-Liste: sortierbar, filterbar, paginiert, Skeleton-Loader
- Kunden-Formular: Anlegen + Bearbeiten (React Hook Form + Zod)
- Kunden-Detailseite: alle Felder + verknüpfte Aufträge
- Soft-Delete mit Bestätigungsdialog
- Toast-Feedback (Erfolg + Fehler)
- API-Routen: GET/POST `/api/customers`, GET/PATCH/DELETE `/api/customers/[id]`
- Vollständige Auth + Authorization-Checks
- Dark Mode für alle neuen Komponenten

---

## Phase 3 — Mitarbeiterverwaltung (CRUD + UI) ✅

**Status:** Abgeschlossen  
**Umfang:**
- Mitarbeiter-Liste mit Status-Badges
- Mitarbeiter-Formular (inkl. Foto-Upload)
- Verschlüsselte Felder: Steuer-ID, SV-Nummer
- Detailseite: Stunden-Übersicht, aktuelle Aufträge
- API-Routen analog zu Kunden

---

## Phase 4 — Aufträge & Kalender ✅

**Status:** Abgeschlossen  
**Umfang:**
- Auftrags-CRUD mit Mitarbeiter-Zuweisung
- Wiederkehrende Aufträge
- Kalender-Ansicht (Wochen-/Monatsansicht)
- Status-Management (GEPLANT → IN_BEARBEITUNG → ABGESCHLOSSEN)

---

## Phase 5 — Zeiterfassung & Tracker

**Status:** In Bearbeitung  
**Umfang:**
- Check-in/Check-out mit GPS
- Stundenauswertung pro Mitarbeiter
- Admin-Übersicht: Wer ist heute wo?
- Export CSV/PDF für Lohnabrechnung

---

## Phase 6 — Dashboard & KPIs

**Status:** Ausstehend  
**Umfang:**
- KPI-Karten (Kunden, Mitarbeiter, Aufträge, Umsatz)
- Balkendiagramm: Stunden pro Mitarbeiter (recharts)
- Liniendiagramm: Umsatzverlauf 12 Monate
- Liste heutige Termine
- Liste anstehende Aufgaben

---

## Phase 7 — KI-Agent

**Status:** Ausstehend  
**Umfang:**
- Floating Chat-Button auf allen Seiten
- Anthropic Claude API, Streaming, Tool-Use
- Tools: createCustomer, updateCustomer, listCustomers, createEmployee, listEmployees, scheduleJob, getEmployeeHours, generateMonthlyReport, findAvailableEmployee
- Tool-Call-Cards im UI (Loading → Ergebnis)
- Bestätigung vor destruktiven Aktionen
- Token-Tracking per Session

---

## Phase 8 — Polish

**Status:** Ausstehend  
**Umfang:**
- Theme-Toggle (Dark/Light)
- Animationen (transform + opacity, Spring-Easing)
- Empty States mit Illustration + CTA
- Mobile-Responsive (Sidebar Collapse, Card-Tabellen)
- Accessibility-Audit (WCAG AA)
- README.md Setup-Anleitung

---

## Deployment-Hinweise (für später)

- Produktions-DB: Supabase oder Neon (PostgreSQL)
- Uploads: Supabase Storage oder AWS S3
- Hosting: Vercel (Next.js native)
