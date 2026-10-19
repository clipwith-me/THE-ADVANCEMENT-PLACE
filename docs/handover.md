# Handover guide

For the business owner's plain-language version, see [owners-guide.md](owners-guide.md).

## Administrators

Day to day, staff are added and removed in **Admin › Staff** (invite by email; remove access = suspend). The CLI below is only for creating the very first administrator, or as a fallback.

- Create: `npm run admin:create -- --email staff@example.com --name "Staff Name"` (password prompted, hidden; ≥14 characters). For CI/deploy pipes: `printf '%s' "$PW" | npm run admin:create -- --email … --name … --password-stdin`.
- Promote an existing account: `npm run admin:grant -- --email …`
- Revoke: `npm run admin:revoke -- --email …` (refuses to remove the last active admin). Role changes end that user's sessions immediately.
- List: `npm run admin:list`. All of these write to the activity log.
- Admin sign-in is at `/admin/login`. Admins can change their password under Admin › Settings.

## Day-to-day

- **Jobs**: Admin › Jobs › New job → *Save as draft* → *Preview* → *Publish*. Close a job to stop applications; archive to hide it; reopen returns it to draft. Only tick "Show the employer's name" when the employer authorises it, and only enter salaries the employer has confirmed.
- **Applications**: filter by status or job; open one to see the details as submitted, see the passport photo submitted with it, download the CV, change status (optionally emailing the candidate) and add internal notes (never shown to candidates).
- **Candidates**: search, view profiles, suspend/reactivate (preferred over deletion). Candidates delete their own accounts under Account settings.
- **Enquiries**: three inboxes (career, outsourcing, contact) with New / In progress / Resolved and internal notes. Each enquiry shows a warning if its email notification wasn't delivered.
- **Settings**: public job adverts on/off, CV and passport photo required for a complete profile, pause applications, announcement banner.

## Demo data — remove before launch

Demo vacancies are flagged `isDemo`, labelled "Demo listing", noindexed and excluded from the sitemap. Remove them with:

```bash
npm run db:demo:remove          # dry run: shows how many
npm run db:demo:remove -- --yes # deletes demo jobs and any applications to them
```

## Email troubleshooting

In the host shell run `npm run email:test -- --to you@example.com`. It shows the SMTP settings in use (never the password), tests the login, sends one email and explains common failures (wrong SMTP login/key, blocked port, unverified sender). Failed sends in normal use log `email.send_failed` with the SMTP code and response.

## Data retention

`npm run retention:purge` (dry run) / `-- --yes` deletes CVs and passport photos that are only attached to unsuccessful/withdrawn applications older than `RETENTION_DAYS` (default 365), attachments of enquiries resolved that long ago, expired sessions and spent tokens. Agree the period with the client's legal adviser and schedule it monthly.

## Still needed from the client

- A horizontal/vector (SVG) version of the logo; the header currently pairs the supplied mark with the name set in text because the full lockup is illegible at header size.
- Real vacancies (and confirmation of which employers may be named / salaries published).
- SMTP provider account and a verified sending domain.
- Legal review of the Privacy Policy, Terms and retention period (NDPA 2023).
- Any service fees or eligibility rules for career assistance (none are stated on the site).
- Optional: licensed photography of the office/team (none was invented).

## Automation (no developer needed for routine upkeep)

- **CI** (`.github/workflows/ci.yml`): lint, typecheck, tests, build and dependency audit on every push and PR.
- **Dependabot** (`.github/dependabot.yml`): monthly grouped minor/patch updates; `dependabot-automerge.yml` merges them once CI passes. Major upgrades stay open for a developer.
- **Maintenance** (`.github/workflows/maintenance.yml`): health check of `SITE_URL` every 6 hours (a failure emails the repo owner) and the retention purge on the 1st of each month.

One-time GitHub setup for this to work:
1. Settings → General: set the default branch to `main`; tick **Allow auto-merge**.
2. Settings → Branches: protect `main`, require the **CI / checks** status check.
3. Settings → Secrets and variables → Actions: variable `SITE_URL=https://theadvancementplace.com`; secrets `PRODUCTION_DATABASE_URL` (Neon pooled URL) and `PRODUCTION_SESSION_SECRET` (same value as on Render).
4. Make sure the account that should receive failure alerts watches the repository.
