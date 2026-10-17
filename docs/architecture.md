# Architecture

## Why this shape

A single Next.js application plus one PostgreSQL database. For a small recruitment business this is the cheapest reliable setup (one host + one managed DB, typically free–low-cost tiers), easy to hand over, and enough headroom for tens of thousands of candidates. No microservices, queues or separate API server.

## Layers

```
src/app/…            Routes (pages, Server Actions, route handlers) — thin: parse form, call a service, map the result
src/server/services  Application services: all business rules, authorisation checks, transactions
src/server/auth      Sessions (DB-backed), per-request guards (require*), central policies.ts
src/server/storage   File validation (magic-byte sniffing) + StorageProvider (Postgres by default)
src/server/email     SMTP adapter (never throws; reports delivery honestly) + escaped templates
src/lib/domain       Pure rules: profile completeness, job visibility, safe redirects, formatting
src/lib/validation   Zod schemas shared by server (authoritative) and forms
prisma/              Schema, migrations, reference seed, demo seed
scripts/             Admin CLI, demo removal, retention purge
```

Rules: no business logic in components or route handlers; every service that touches protected data receives an `Actor` and checks a policy from `src/server/auth/policies.ts`. Pages call `requireAdmin()` / `requireCandidate()` / `requireCompleteCandidate()`; the proxy's cookie check is only a fast redirect.

## Key flows

- **Profile gate** — `evaluateProfileCompleteness()` (pure) is evaluated live on every gated request and action: `/jobs`, applying, and job pages (when public previews are off). Incomplete → redirect to `/account/setup?next=…` listing what's missing. Required: name, email, phone, state, experience summary (`headline`), highest qualification, ≥1 skill, passport photo, CV (photo and CV requirements toggleable in admin settings). NYSC is never required.
- **Job visibility** — `liveJobWhere()` / `publicJobState()`: only `PUBLISHED` jobs with no passed deadline are listed, searchable, indexable or open to applications. Expired/closed adverts show "no longer accepting applications" and are noindexed; drafts/archived 404.
- **Applications** — one per candidate per job, enforced by a `@@unique([jobId, candidateId])` constraint (concurrent double-submits are caught). Each application keeps a profile snapshot and a reference to the CV used; replacing a CV never alters past applications. Status changes are written to `ApplicationStatusEvent`; internal notes live in a separate admin-only table.
- **Enquiries** — persisted first, then the notification email is attempted; `notifiedAt` records whether it was delivered, and the admin view warns when it wasn't.

## Data model (summary)

`User` (role CANDIDATE/ADMIN, status) · `Session` (SHA-256 of token) · `AuthToken` (hashed, single-use, expiring) · `CandidateProfile` (+ `CandidateSkill`/`Skill`, `EducationRecord`, `WorkExperience`) · `StoredFile` + `FileBlob` · `JobCategory` · `Job` · `Application` + `ApplicationStatusEvent` + `ApplicationNote` · `Enquiry` · `AuditEvent` · `RateLimitBucket` · `SiteSettings`. Indexes cover the board's filters (status/publishedAt, status/deadline, category, state) and admin lists.

## Storage choice for CVs

Default `StorageProvider` writes bytes to the `FileBlob` table. Pros: private by construction, persistent across redeploys (no ephemeral filesystem), included in DB backups, zero extra vendor. Cost: DB size grows ~0.2–1 MB per CV — fine into the low thousands of CVs on typical managed-Postgres plans. To scale, implement `StorageProvider` against a private S3/R2 bucket (signed, server-side reads only) and migrate keys; nothing else changes.

## Rendering & performance

All pages are server-rendered (dynamic) because each response carries a per-request CSP nonce. Client JavaScript is limited to forms, filters and menus. Search, filters and pagination run in SQL (10 jobs/page; admin lists 20/page). Fonts are self-hosted by `next/font`; the logo uses `next/image` with fixed sizes.
