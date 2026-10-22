# Security

This document lists what is implemented and tested. It is not a certification; an independent penetration test is recommended before handling large volumes of candidate data.

## Implemented controls

**Authentication**
- Argon2id password hashing (`@node-rs/argon2`, OWASP parameters). Hashes are never selected in admin/candidate queries.
- Database sessions: 256-bit random token in an `HttpOnly`, `SameSite=Lax`, `Secure` (production, `__Host-` prefix) cookie; only its SHA-256 is stored. Candidate sessions 30 days sliding; admin sessions 12 hours.
- Logout deletes the session server-side. Password change signs out other devices; password reset, suspension and role changes sign out all sessions.
- Reset and verification tokens: random, hashed at rest, single-use (atomic consume), 30 min / 24 h expiry. Reset requests return the same response whether or not the email exists.
- Login uses one generic error and equalises timing for unknown emails. Admin portal rejects non-admins with the same error.
- No default credentials. Admins are created only by the CLI (`npm run admin:create`); registration hard-codes the CANDIDATE role.

**Authorisation**: centralised in `src/server/auth/policies.ts`; every service re-checks. Candidates can only reach their own profile, applications and files (other IDs return 404). Admin pages, actions and downloads all verify the ADMIN role server-side.

**CSRF**: Server Actions only accept same-origin POSTs (Next.js Origin check) and the cookie is `SameSite=Lax`. The only route handlers are GET (file download, health).

**Input**: Zod schemas on the server for every form and query; unknown fields dropped (no mass assignment of role/status/organisation/etc.); Prisma parameterised queries (one raw query, parameterised); URLs restricted to http(s); open-redirect-safe `?next=` handling. React escapes all output; no `dangerouslySetInnerHTML` except JSON-LD with `<` escaped. Email templates escape user content.

**Files**: PDF/DOCX only, validated by content (magic bytes) and extension; PDFs with JavaScript/Launch/embedded files and macro-enabled Word files rejected; size limit (`MAX_UPLOAD_MB`, default 5); server-generated storage keys; sanitised display names; private storage (database); downloads only via `/api/files/:id` with an ownership/role check, `Content-Disposition: attachment`, `nosniff`, `no-store`, sandbox CSP. Admin downloads are audited.

**Passport photos**: JPEG/PNG only, validated by content and extension, min 150×150 px, same size limit; EXIF/XMP/ICC/comments and PNG text/EXIF/time chunks are stripped before storage (only the orientation flag is kept), so no GPS or device data is retained. Served through the same authorised endpoint with `inline` disposition, `nosniff`, a sandbox CSP and a 1-hour private cache (a new upload always gets a new ID). Photo views are not audited, to keep the audit log meaningful.

**Public media** (`/media/:id`): serves only About-page photos while published and job flyers while their job is publicly visible; CVs, candidate photos and enquiry attachments are never served there (tested). Admin images are validated, then re-encoded by sharp (resized, all metadata dropped). Reviews are moderated before display, rate-limited separately, and the database enforces 1–5 star ratings.

**Headers**: nonce-based CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `frame-ancestors 'none'`, `object-src 'none'`), HSTS (production), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, no `X-Powered-By`. Private areas: `Cache-Control: private, no-store` and `noindex`.

**Abuse prevention**: Postgres-backed rate limits (login per IP and per account, registration, reset, verification resend, public forms, uploads, applications); identifiers HMAC'd, raw IPs never stored. Honeypot field + consent checkbox on public forms.

**Logging & errors**: structured JSON logs with sensitive-key redaction; unexpected errors show a reference ID, never stack traces. Append-only `AuditEvent` table for logins, failed logins, job/application/enquiry/settings changes, downloads, deletions.

**Secrets**: env-only, validated at startup; the app refuses to start in production with the placeholder `SESSION_SECRET`. No variable uses the `NEXT_PUBLIC_` prefix.

## Tests (run, passing)

Integration (`tests/integration`, real Postgres): registration/login/generic errors, admin portal rejection, brute-force lockout, session expiry & suspension, reset single-use/expiry/session invalidation, mass-assignment of role/status/isDemo, IDOR on applications and CVs, admin-only actions, duplicate applications incl. concurrency, draft/expired/closed visibility, SQL-injection search strings, XSS payload escaping in email, invalid/oversized/active-content uploads, photo type/size checks and metadata stripping, photo access control, public-form rate limits, account deletion.
E2E (`e2e/`): security headers, private-route redirects, candidate cannot open another's application/CV or `/admin`, anonymous CV download 404, CSP present.

## Known limitations / operational requirements

- **No malware scanning** (no scanner configured). Mitigated by narrow types and active-content rejection. If volume grows, add a scanning service (e.g. ClamAV container or a cloud scanner) in `storeDocument()`.
- Rate limiting is per IP; attackers with many IPs are slowed only by per-account limits. Consider Cloudflare (free plan) in front of the site.
- `X-Forwarded-For` is trusted for client IP — correct on Vercel/most PaaS; review if self-hosting behind another proxy.
- Email verification is not enforced by default (`REQUIRE_EMAIL_VERIFICATION=false`) because it needs working SMTP. Turn it on once email is configured.
- Verification links are consumed on GET; aggressive email link scanners could consume them (the user can resend).
- Dev-only dependency advisory: `braces` (via ESLint tooling), no upstream fix; not shipped to production. `npm audit --omit=dev`: 0 vulnerabilities at handover.
- Privacy policy and retention period describe the system's actual behaviour but must be reviewed by the client's legal adviser against the Nigeria Data Protection Act 2023 (including whether NDPC registration/filing applies).
