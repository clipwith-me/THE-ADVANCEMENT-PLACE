import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowRight, CalendarX2, CheckCircle2, LogIn, PauseCircle, Pencil, UserPlus, UserRoundCog } from "lucide-react";
import { BoardGate } from "@/components/jobs/board-gate";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetail } from "@/components/jobs/job-detail";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { BUSINESS } from "@/lib/business";
import { formatDate } from "@/lib/domain/format";
import { liveJobCount, getPublicJob, relatedJobs, type PublicJob } from "@/server/services/job-service";
import { getCurrentUser } from "@/server/auth/current";
import { getCompleteness } from "@/server/services/profile-service";
import { myApplicationForJob } from "@/server/services/application-service";
import { getSettings } from "@/server/services/settings-service";
import { siteUrl } from "@/lib/seo";
import { ApplyForm } from "./apply-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPublicJob(slug);
  if (!found) return { title: "Job not found", robots: { index: false } };
  const { job, state } = found;
  const settings = await getSettings();
  // Only live, real vacancies are indexable. Demo, expired and closed jobs are not.
  const indexable = state === "LIVE" && !job.isDemo && settings.publicJobPreview;
  const where = job.city ? `${job.city}, ${job.state}` : job.state;
  return {
    title: `${job.title} — ${where}`,
    description: job.summary.slice(0, 160),
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title: job.title, description: job.summary, url: `/jobs/${job.slug}`, siteName: BUSINESS.name, type: "website" },
    robots: indexable ? undefined : { index: false, follow: false },
  };
}

const SCHEMA_EMPLOYMENT: Record<PublicJob["employmentType"], string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  TEMPORARY: "TEMPORARY",
};

/** schema.org JobPosting — only job data, never anything about candidates. */
function jobPostingJsonLd(job: PublicJob) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.summary, job.description, ...job.responsibilities, ...job.requirements].join("\n\n"),
    datePosted: job.publishedAt?.toISOString(),
    employmentType: SCHEMA_EMPLOYMENT[job.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: job.showEmployer && job.employerName ? job.employerName : BUSINESS.name,
      ...(job.showEmployer && job.employerName ? {} : { sameAs: siteUrl() }),
    },
    url: `${siteUrl()}/jobs/${job.slug}`,
    identifier: { "@type": "PropertyValue", name: BUSINESS.name, value: job.id },
    industry: job.category.name,
  };
  if (job.deadline) data.validThrough = job.deadline.toISOString();
  if (job.workArrangement === "REMOTE") {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "Nigeria" };
  } else {
    data.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.city ?? undefined, addressRegion: job.state, addressCountry: "NG" },
    };
  }
  if (job.salaryMin != null || job.salaryMax != null) {
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "NGN",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin ?? undefined,
        maxValue: job.salaryMax ?? undefined,
        unitText: job.salaryPeriod === "YEAR" ? "YEAR" : "MONTH",
      },
    };
  }
  if (job.experienceYearsMin) {
    data.experienceRequirements = { "@type": "OccupationalExperienceRequirements", monthsOfExperience: job.experienceYearsMin * 12 };
  }
  return data;
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const found = await getPublicJob(slug);
  if (!found) notFound();
  const { job, state } = found;
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const here = `/jobs/${job.slug}`;

  // When the client turns public previews off, job pages follow the board gate.
  if (!settings.publicJobPreview && !user) return <BoardGate next={here} liveCount={await liveJobCount()} />;

  const live = state === "LIVE";
  const related = live ? await relatedJobs(job) : [];
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  let panel: React.ReactNode;
  if (!live) {
    panel = (
      <div>
        <p className="flex items-center gap-2 font-semibold text-ink-900">
          <CalendarX2 aria-hidden className="size-5 text-warning-700" /> No longer accepting applications
        </p>
        <p className="mt-2 text-sm text-ink-600">
          {state === "EXPIRED" && job.deadline ? `The application deadline was ${formatDate(job.deadline)}.` : "This vacancy has closed."}
        </p>
        <ButtonLink href="/jobs" variant="secondary" className="mt-4 w-full">
          Browse open vacancies
        </ButtonLink>
      </div>
    );
  } else if (!user) {
    const q = `?next=${encodeURIComponent(here)}`;
    panel = (
      <div>
        <p className="font-semibold text-ink-900">Interested in this role?</p>
        <p className="mt-1.5 text-sm text-ink-600">Create a free account and complete your profile to apply.</p>
        <div className="mt-4 grid gap-2">
          <ButtonLink href={`/register${q}`} size="lg">
            <UserPlus aria-hidden className="size-4" /> Create account to apply
          </ButtonLink>
          <ButtonLink href={`/login${q}`} variant="secondary" size="lg">
            <LogIn aria-hidden className="size-4" /> Sign in
          </ButtonLink>
        </div>
      </div>
    );
  } else if (user.role === "ADMIN") {
    panel = (
      <div>
        <p className="text-sm text-ink-600">You&apos;re viewing this vacancy as an administrator.</p>
        <ButtonLink href={`/admin/jobs/${job.id}/edit`} variant="dark" className="mt-3 w-full">
          <Pencil aria-hidden className="size-4" /> Edit vacancy
        </ButtonLink>
      </div>
    );
  } else {
    const [{ bundle, result }, existing] = await Promise.all([getCompleteness(user.id), myApplicationForJob(user, job.id)]);
    if (existing) {
      panel = (
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink-900">
            <CheckCircle2 aria-hidden className="size-5 text-success-700" /> You applied on {formatDate(existing.createdAt)}
          </p>
          <div className="mt-3">
            <ApplicationStatusBadge status={existing.status} />
          </div>
          <ButtonLink href={`/account/applications/${existing.id}`} variant="secondary" className="mt-4 w-full">
            View application <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        </div>
      );
    } else if (!result.complete) {
      panel = (
        <div>
          <p className="font-semibold text-ink-900">Complete your profile to apply</p>
          <p className="mt-1.5 text-sm text-ink-600">
            {result.missing.length} required {result.missing.length === 1 ? "item is" : "items are"} missing from your profile.
          </p>
          <ButtonLink href={`/account/setup?next=${encodeURIComponent(here)}`} size="lg" className="mt-4 w-full">
            <UserRoundCog aria-hidden className="size-4" /> Finish my profile
          </ButtonLink>
        </div>
      );
    } else if (!settings.applicationsOpen) {
      panel = (
        <p className="flex gap-2 text-sm text-ink-700">
          <PauseCircle aria-hidden className="size-5 shrink-0 text-warning-700" /> Applications are temporarily paused. Please check back
          soon.
        </p>
      );
    } else {
      panel = (
        <div>
          <p className="mb-4 font-semibold text-ink-900">Apply for this role</p>
          <ApplyForm jobId={job.id} slug={job.slug} cvName={bundle.profile?.currentCv?.originalName ?? null} />
        </div>
      );
    }
  }

  return (
    <>
      {live && !job.isDemo && (
        <script
          type="application/ld+json"
          nonce={nonce}
          // JSON.stringify output with "<" escaped cannot break out of the script element.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)).replace(/</g, "\\u003c") }}
        />
      )}
      <nav aria-label="Breadcrumb" className="container-page pt-6 text-sm text-ink-600">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-ink-900">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/jobs" className="hover:text-ink-900">
              Jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="max-w-[16rem] truncate text-ink-900">
            {job.title}
          </li>
        </ol>
      </nav>
      <JobDetail
        job={job}
        applyPanel={panel}
        banner={
          job.isDemo ? (
            <Alert tone="warning" title="Demonstration listing" className="mb-6">
              This vacancy is sample content for demonstration purposes. It is not a real job opening.
            </Alert>
          ) : undefined
        }
      />
      {related.length > 0 && (
        <section className="border-t border-ink-200 bg-ink-50 py-12" aria-labelledby="related-heading">
          <div className="container-page">
            <h2 id="related-heading" className="font-display text-2xl font-semibold">
              Similar vacancies
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <JobCard key={r.id} job={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
