# Owner's guide: running the website without a developer

This guide is for The Advancement Place staff. Day-to-day, the website needs no developer: everything below is either automatic or done from the admin dashboard.

## What runs automatically

| What | How | What you see |
| --- | --- | --- |
| Hosting, HTTPS certificate, server updates | Render (managed) | Nothing to do |
| Database backups and restore history | Neon (managed) | Nothing to do |
| Security and library updates | Dependabot opens one update a month; it is merged automatically only if all automated tests pass, then Render publishes it | An occasional email from GitHub |
| Deleting old CVs (data protection) | Monthly scheduled job | Nothing to do |
| Uptime check | Every 6 hours; if the site is down, GitHub emails the account owner | An email only when something is wrong |
| Deploying changes | Render publishes `main` automatically, after checking the site starts correctly | Nothing to do |

## What your staff do in the dashboard (`/admin`)

- **Jobs**: create, publish, close and archive vacancies.
- **Applications**: review, change status (the candidate is emailed), add notes, download CVs.
- **Candidates**: search and suspend accounts.
- **Enquiries**: career assistance, freelance/outsourcing and contact messages.
- **Staff**: add a staff member (they receive an email to choose a password) or remove someone's access. Keep at least two active administrators so one can always help the other.
- **Settings**: pause applications, show a banner, choose whether job adverts are public.

Forgotten password: use "Forgot your password?" on the sign-in page. It works for staff and candidates.

## The few things that need attention

| When | What | Who |
| --- | --- | --- |
| Once a year | Renew the domain (turn on auto-renew so this is automatic) | Owner |
| Monthly | Check the Render, Neon and Brevo bills are paid (card on file) | Owner |
| If GitHub emails "Scheduled maintenance failed" | The site may be down: open the site; if it is down, contact your developer and Render support | Owner |
| If a Dependabot "major" update stays open for months | Ask a developer to review it (about an hour's work) | Any developer |
| New features or design changes | A developer | Any developer |

Any developer familiar with Next.js and PostgreSQL can work on this site. Everything they need is in the repository's README and `docs/` folder.

## Accounts to keep safe

Store these in a password manager, with two-factor sign-in turned on, and make sure at least two trusted people at The Advancement Place have access: the domain registrar, Render, Neon, Brevo and GitHub.
