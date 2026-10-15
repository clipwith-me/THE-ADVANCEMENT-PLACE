# Handover guide

## Administrators

- Create: `npm run admin:create -- --email staff@example.com --name "Staff Name"` (password prompted, hidden; ≥14 characters). For CI/deploy pipes: `printf '%s' "$PW" | npm run admin:create -- --email … --name … --password-stdin`.
- Promote an existing account: `npm run admin:grant -- --email …`
- Revoke: `npm run admin:revoke -- --email …` (refuses to remove the last active admin). Role changes end that user's sessions immediately.
- List: `npm run admin:list`. All of these write to the activity log.
- Admin sign-in is at `/admin/login`. Admins can change their password under Admin › Settings.

## Day-to-day

- **Jobs**: Admin › Jobs › New job → *Save as draft* → *Preview* → *Publish*. Close a job to stop applications; archive to hide it; reopen returns it to draft. Only tick "Show the employer's name" when the employer authorises it, and only enter salaries the employer has confirmed.
- **Applications**: filter by status or job; open one to see the details as submitted, download the CV, change status (optionally emailing the candidate) and add internal notes (never shown to candidates).
- **Candidates**: search, view profiles, suspend/reactivate (preferred over deletion). Candidates delete their own accounts under Account settings.
- **Enquiries**: three inboxes (career, outsourcing, contact) with New / In progress / Resolved and internal notes. Each enquiry shows a warning if its email notification wasn't delivered.
- **Settings**: public job adverts on/off, CV required for a complete profile, pause applications, announcement banner.

## Demo data — remove before launch

Demo vacancies are flagged `isDemo`, labelled "Demo listing", noindexed and excluded from the sitemap. Remove them with:

```bash
npm run db:demo:remove          # dry run: shows how many
npm run db:demo:remove -- --yes # deletes demo jobs and any applications to them
```

## Data retention

`npm run retention:purge` (dry run) / `-- --yes` deletes CVs that are only attached to unsuccessful/withdrawn applications older than `RETENTION_DAYS` (default 365), attachments of enquiries resolved that long ago, expired sessions and spent tokens. Agree the period with the client's legal adviser and schedule it monthly.

## Still needed from the client

- A horizontal/vector (SVG) version of the logo; the header currently pairs the supplied mark with the name set in text because the full lockup is illegible at header size.
- Real vacancies (and confirmation of which employers may be named / salaries published).
- SMTP provider account and a verified sending domain.
- Legal review of the Privacy Policy, Terms and retention period (NDPA 2023).
- Any service fees or eligibility rules for career assistance (none are stated on the site).
- Optional: licensed photography of the office/team (none was invented).
