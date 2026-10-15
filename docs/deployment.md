# Deployment

**Status: not deployed yet.** The repository is ready for Render (web) + Neon (PostgreSQL) + Brevo (email). Nothing has been purchased or provisioned. Running costs: see the hosting cost note (about $12–22/month).

The client owns every account; Configur is invited as a team member.

## 1. Neon — database (about 10 minutes)

1. Create an account at neon.com and a project named `the-advancement-place`. Choose region **AWS eu-central-1 (Frankfurt)**, the same region as the Render service.
2. Upgrade to the **Launch** plan (pay-as-you-go). This gives restore history; the free plan is for testing only.
3. Under **Connect**, copy two connection strings for the `main` branch:
   - **Pooled** (host contains `-pooler`) → becomes `DATABASE_URL`
   - **Direct** (no `-pooler`) → becomes `DIRECT_DATABASE_URL` (used only for migrations)
   Both must end in `?sslmode=require`.

## 2. Brevo — email (about 15 minutes, plus DNS propagation)

1. Create a free account at brevo.com.
2. **Senders, domains & dedicated IPs → Domains → Add domain**: `theadvancementplace.com`. Add the DNS records Brevo shows (DKIM, Brevo code, DMARC) at the domain registrar and wait until all show as verified.
3. Add sender `no-reply@theadvancementplace.com`.
4. **SMTP & API → SMTP**: note the SMTP login, and generate an SMTP key. These become `SMTP_USER` and `SMTP_PASSWORD`.

## 3. Render — website (about 15 minutes)

1. Merge the release branch into `main` (the Blueprint deploys `main`).
2. Create an account at render.com (Hobby workspace) and connect GitHub with access to `clipwith-me/THE-ADVANCEMENT-PLACE`.
3. **New → Blueprint** → select the repository. Render reads `render.yaml` and creates the `the-advancement-place` web service (Starter, Frankfurt).
4. When prompted, enter the secrets: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SMTP_USER`, `SMTP_PASSWORD`. `SESSION_SECRET` is generated automatically; all other settings come from `render.yaml`.
5. Apply. Each deploy runs `npm ci --include=dev && npm run build`, then the pre-deploy step `npm run db:migrate:deploy && npm run db:seed` (migrations + categories; never demo data), then `npm start`. Render checks `/api/health` before switching traffic.
6. Until the domain is connected, temporarily set `APP_URL` to the service's `https://….onrender.com` address so links in emails work, and set it back in step 5.

## 4. First administrator

From a computer with the repository and Node 22 installed:

```bash
DATABASE_URL="<Neon pooled URL>" SESSION_SECRET="<copy from Render>" \
  npm run admin:create -- --email <staff email> --name "<Full Name>"
```

The command prompts for a password (at least 14 characters). Never share or commit it. Alternatively, run the same command in the service's **Shell** tab on Render.

## 5. Domain

In Render: service → **Settings → Custom Domains** → add `theadvancementplace.com` and `www.theadvancementplace.com`. At the registrar, add the records Render displays (an `A` record for the root domain and a `CNAME` for `www`). Render issues the HTTPS certificate automatically. Then set `APP_URL=https://theadvancementplace.com` and redeploy.

## 6. Go-live checks

- [ ] `https://theadvancementplace.com/api/health` returns `{"status":"ok"}`
- [ ] Response headers include `Content-Security-Policy` and `Strict-Transport-Security`
- [ ] Admin › Settings shows "Email sending: Configured"
- [ ] Register a test candidate: the confirmation email arrives; password-reset email arrives and its link works only once
- [ ] Complete a profile, upload a CV, apply; the confirmation email arrives
- [ ] Admin: create and publish a job, change the test application's status, download the CV
- [ ] Signed out, the CV link returns 404
- [ ] Contact, career-assistance and outsourcing forms appear in the dashboard and arrive at advancementplace@gmail.com
- [ ] Check the site on a phone and a laptop
- [ ] Delete the test account; `npm run db:demo:remove` reports 0 demo jobs
- [ ] Submit `https://theadvancementplace.com/sitemap.xml` in Google Search Console
- [ ] Once email is confirmed working, set `REQUIRE_EMAIL_VERIFICATION=true`

## Backups and recovery

All data, including CVs, is in Neon, so the database is the full backup. Neon Launch keeps restore history, so the database can be rolled back to an earlier point in time. Also take a monthly `pg_dump` (using `DIRECT_DATABASE_URL`) to separate, access-controlled storage, and test a restore into a Neon branch once before launch. Keep the secrets in a password manager.

## Monthly maintenance

- `npm run retention:purge` (dry run), then `-- --yes`, using the production `DATABASE_URL`. This deletes documents past the retention period.
- Review Render and Neon usage and bills.
- Update dependencies and redeploy; CI runs lint, typecheck, tests, build and a dependency audit on every push.

## Other hosts

The app runs on any Node 22 host with PostgreSQL. On Vercel, request bodies are capped near 4.5 MB, so set `MAX_UPLOAD_MB=4`.
