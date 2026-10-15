# Implementation plan & status

## Inspection findings (start of project)

The repository was empty (no code, no assets). Only the client logo (JPEG on white) was supplied. Palette sampled from it: highlight orange `#F29840`, copper `#D28945`, bronze `#6E604E`; text-safe brand orange `#A3561A` (5.4:1 on white). Stack chosen accordingly — see architecture.md.

## Checklist

**Phase 1 — Foundation** ✅ Next.js 16/TS/Tailwind 4, design tokens, Prisma schema + migration, DB sessions, Argon2id, central policies, env validation, rate limiting, audit log, logger.
**Phase 2 — Public site** ✅ Homepage, About, Career Assistance, Freelance & Outsourcing, Contact, Privacy, Terms, 404, error, access-denied; job board + details; SEO (metadata, canonical, OG, sitemap, robots, JobPosting JSON-LD); accessibility basics.
**Phase 3 — Candidates** ✅ Register/login/forgot/reset/verify; profile setup gate; full profile with education & work history; private CV upload/replace/remove; apply; history with status timeline; withdraw; change password; delete account.
**Phase 4 — Administration** ✅ CLI provisioning; overview metrics + chart; job CRUD/lifecycle/preview; applications (filters, CV download, status + email, notes); candidates (search, suspend); enquiries ×3; settings; activity log.
**Phase 5 — Security & quality** ✅ CSP/headers, rate limits, upload validation, IDOR tests; 77 unit/integration tests; 37 E2E tests (desktop + mobile, 320 px overflow checks); lint/typecheck/build clean.
**Phase 6 — Deployment readiness** ✅ `.env.example`, deployment, backup, demo-removal and handover docs; CI workflow. ⏳ Actual deployment needs client accounts (hosting, DB, SMTP, DNS).

## Deferred (future phases)

S3/R2 storage + malware scanning; recruiter role with narrower permissions; saved jobs & job alerts; multi-file document library per candidate; admin-editable page content (CMS); analytics with consent; WhatsApp/SMS notifications; employer self-service portal.
