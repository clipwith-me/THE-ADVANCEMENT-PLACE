# Deployment

**Status: not deployed.** The code is production-ready pending the configuration below. Nothing has been purchased or provisioned.

## Recommended setup (low cost)

| Need | Recommendation | Alternatives |
| --- | --- | --- |
| App hosting | Vercel (Hobby is non-commercial; use Pro for a client business) | Render, Railway, Fly.io, any Node 20 host |
| PostgreSQL | Neon or Supabase (managed, daily backups/PITR) | Railway Postgres, AWS RDS |
| Email (SMTP) | Brevo / Mailgun / Amazon SES with the domain verified (SPF, DKIM, DMARC) | Gmail App Password for very low volume only |
| CV storage | Built in (Postgres) — nothing to set up | S3/R2 later via `StorageProvider` |

## Steps

1. **Database** — create a Postgres DB; copy the pooled connection string (`sslmode=require`).
2. **Environment variables** (hosting dashboard; see `.env.example` for all):
   - `DATABASE_URL`, `APP_URL=https://theadvancementplace.com`, `SESSION_SECRET=$(openssl rand -hex 32)`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` (verified sender), `NOTIFY_EMAIL=advancementplace@gmail.com`
   - optional: `REQUIRE_EMAIL_VERIFICATION=true` (once email works), `MAX_UPLOAD_MB`, `RETENTION_DAYS`
3. **Build command**: `npm run build`. Start: `npm start` (or the platform default for Next.js).
4. **Migrations + reference data** (from your machine or a release step, with production `DATABASE_URL`):
   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```
   Do **not** run `db:seed:demo` in production (it refuses unless `ALLOW_DEMO_DATA=true`, intended for a staging/demo site only).
5. **First administrator**: `npm run admin:create -- --email <staff email> --name "<Name>"` (prompts for a ≥14-char password). Never share or commit it.
6. **Domain & DNS** (at the registrar for theadvancementplace.com): add the records your host gives you (Vercel: `A 76.76.21.21` for the apex and `CNAME cname.vercel-dns.com` for `www`). HTTPS certificates are issued automatically. Add the email provider's SPF/DKIM/DMARC records.
7. **Body size**: uploads go through Server Actions (limit 8 MB transport, 5 MB app). Vercel functions accept up to 4.5 MB request bodies — on Vercel set `MAX_UPLOAD_MB=4` or host on Render/Railway for 5 MB+.
8. **Scheduled job**: run `npm run retention:purge -- --yes` monthly (Vercel Cron calling a protected endpoint, Render cron job, or manually).

## Post-deploy checklist

- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] Response headers include CSP and `Strict-Transport-Security`
- [ ] Register a test candidate; verification email arrives; reset-password email arrives and link works once
- [ ] Complete profile, upload a CV, apply; confirmation email arrives
- [ ] Admin: sign in, create/publish a job, change an application status, download the CV
- [ ] Logged-out request to a CV URL returns 404
- [ ] Contact/career/outsourcing forms land in the dashboard and in `NOTIFY_EMAIL`
- [ ] Admin › Settings shows "Email sending: Configured"
- [ ] Check phone + desktop layouts on the live domain
- [ ] Submit `https://theadvancementplace.com/sitemap.xml` in Google Search Console
- [ ] Delete test accounts/applications; confirm no demo jobs (`npm run db:demo:remove` reports 0)

## Backups & recovery

All data, including CVs, is in Postgres, so the database backup is the full backup. Enable your provider's daily backups / point-in-time recovery (Neon & Supabase include this on paid plans); additionally take a weekly `pg_dump` to separate, access-controlled storage. Test a restore into a scratch database at least once. Keep `SESSION_SECRET` and SMTP credentials in a password manager; rotating `SESSION_SECRET` only resets rate-limit counters.
