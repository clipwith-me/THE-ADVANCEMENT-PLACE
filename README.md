# The Advancement Place

Recruitment, job discovery and career-services platform for **The Advancement Place** (Abeokuta, Ogun State, Nigeria) — theadvancementplace.com. Built by Configur Web Agency.

- **Public site**: homepage, about, career assistance, freelance & outsourcing, contact, privacy, terms, job adverts with JobPosting structured data.
- **Candidates**: register → complete required profile (+ CV) → job board with search/filters → apply → track application status. NYSC status is optional.
- **Administrators**: live dashboard, job lifecycle (draft → publish → close/archive), application review with status history and internal notes, candidate management, enquiry inboxes, site settings, activity log.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Argon2id · Nodemailer (any SMTP) · Lucide icons · Vitest · Playwright.
One deployable app (modular monolith) + one Postgres database. CVs are stored privately **in Postgres** by default — no extra storage service needed. See [docs/architecture.md](docs/architecture.md).

## Quick start (local)

Requires Node 20.11+ and PostgreSQL 14+.

```bash
cp .env.example .env            # set DATABASE_URL; keep the dev SESSION_SECRET locally
npm install
npm run db:migrate               # create tables
npm run db:seed                  # job categories + settings row (needed everywhere)
npm run db:seed:demo             # OPTIONAL: clearly-labelled DEMO vacancies
npm run admin:create -- --email you@example.com --name "Your Name"   # prompts for password
npm run dev                      # http://localhost:3000
```

Without SMTP configured, emails (verification, password reset) are printed to the dev console.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` / `typecheck` / `test` | ESLint, TypeScript, unit + integration tests (needs a `tap_test` DB, see `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Playwright against a production build and a disposable `tap_e2e` DB (`npm run build` first) |
| `npm run gate` | lint + typecheck + test + build |
| `npm run db:migrate` / `db:migrate:deploy` | Create/apply migrations (dev / production) |
| `npm run db:seed` / `db:seed:demo` / `db:demo:remove -- --yes` | Reference data / demo data / remove demo data |
| `npm run admin:create` / `admin:grant` / `admin:revoke` / `admin:list` | First administrator / fallback (day-to-day staff management is in Admin › Staff) |
| `npm run retention:purge -- --yes` | Delete documents past the retention period |

## Documentation

- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — plan, checklist and status
- [docs/architecture.md](docs/architecture.md) — structure, data model, design decisions
- [docs/security.md](docs/security.md) — implemented controls, tests, known limitations
- [docs/deployment.md](docs/deployment.md) — production setup, DNS, email, backups
- [docs/owners-guide.md](docs/owners-guide.md) — running the site without a developer
- [docs/handover.md](docs/handover.md) — admin operations, automation setup, demo removal, retention
- [docs/product-decisions.md](docs/product-decisions.md) — decisions the client should confirm
