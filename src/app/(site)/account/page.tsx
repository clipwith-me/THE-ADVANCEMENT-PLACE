import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, MailWarning, Search, UserRoundCog } from "lucide-react";
import { CompletenessCard } from "@/components/account/profile-parts";
import { ResendVerification } from "@/components/account/resend-verification";
import { JobCard } from "@/components/jobs/job-card";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/domain/format";
import { REQUIREMENT_LABEL } from "@/lib/domain/profile-completeness";
import { env } from "@/lib/env";
import { privateMetadata } from "@/lib/seo";
import { requireCandidate } from "@/server/auth/current";
import { listMyApplications } from "@/server/services/application-service";
import { latestJobs } from "@/server/services/job-service";
import { getCompleteness } from "@/server/services/profile-service";

export const metadata = privateMetadata("My dashboard");

export default async function DashboardPage() {
  const user = await requireCandidate();
  const [{ result }, apps] = await Promise.all([getCompleteness(user.id), listMyApplications(user, 1)]);
  const jobs = result.complete ? await latestJobs(3) : [];
  const active = apps.items.filter((a) => !["SUCCESSFUL", "UNSUCCESSFUL", "WITHDRAWN"].includes(a.status)).length;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {firstName}</h1>
        <p className="mt-1 text-ink-600">Here&apos;s an overview of your profile and applications.</p>
      </div>

      {!user.emailVerifiedAt && (
        <Alert tone="warning" title="Please confirm your email address">
          <p>
            We sent a confirmation link to <strong>{user.email}</strong>.
            {env().REQUIRE_EMAIL_VERIFICATION ? " You'll need to confirm it before applying for jobs." : ""}
          </p>
          <div className="mt-2">
            <ResendVerification />
          </div>
        </Alert>
      )}

      {!result.complete && (
        <section className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 sm:p-6" aria-labelledby="finish-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-brand-200">
                <UserRoundCog aria-hidden className="size-5" />
              </span>
              <div>
                <h2 id="finish-heading" className="font-semibold text-ink-900">
                  Finish your profile to unlock the job board
                </h2>
                <p className="mt-1 text-sm text-ink-700">
                  Still needed: {result.missing.map((k) => REQUIREMENT_LABEL[k]).join(", ")}.
                </p>
              </div>
            </div>
            <ButtonLink href="/account/setup" className="shrink-0">
              Complete profile <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Applications" value={apps.total} href="/account/applications" />
        <Stat label="In progress" value={active} href="/account/applications" />
        <Stat label="Profile" value={`${result.percent}%`} href="/account/profile" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="card p-5 sm:p-6" aria-labelledby="recent-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Recent applications
            </h2>
            {apps.total > 0 && (
              <Link href="/account/applications" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                View all
              </Link>
            )}
          </div>
          {apps.items.length ? (
            <ul className="divide-y divide-ink-100">
              {apps.items.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link href={`/account/applications/${a.id}`} className="flex flex-col gap-2 py-3 hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink-900">{a.job.title}</span>
                      <span className="text-xs text-ink-600">Applied {formatDate(a.createdAt)}</span>
                    </span>
                    <ApplicationStatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BriefcaseBusiness}
              title="No applications yet"
              action={
                result.complete ? (
                  <ButtonLink href="/jobs">
                    <Search aria-hidden className="size-4" /> Find jobs
                  </ButtonLink>
                ) : undefined
              }
            >
              {result.complete ? "Browse the job board and apply for roles that fit you." : "Complete your profile, then start applying."}
            </EmptyState>
          )}
        </section>
        <aside>
          <CompletenessCard result={result} />
        </aside>
      </div>

      {jobs.length > 0 && (
        <section aria-labelledby="new-jobs">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="new-jobs" className="text-lg font-semibold">
              Latest vacancies
            </h2>
            <Link href="/jobs" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Browse all
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      {!user.emailVerifiedAt && (
        <p className="flex items-center gap-2 text-xs text-ink-500">
          <MailWarning aria-hidden className="size-3.5" /> Can&apos;t find the email? Check your spam or promotions folder.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="card block p-5 transition-shadow hover:shadow-lift">
      <p className="text-sm text-ink-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink-900">{value}</p>
    </Link>
  );
}
