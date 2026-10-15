import Link from "next/link";
import { Banknote, Briefcase, Building2, CalendarClock, MapPin, Monitor } from "lucide-react";
import { EMPLOYMENT_TYPE_LABEL, WORK_ARRANGEMENT_LABEL } from "@/lib/domain/labels";
import { formatDate, formatRelative, formatSalary } from "@/lib/domain/format";
import { daysUntil } from "@/lib/domain/job-visibility";
import type { JobCard as JobCardData } from "@/server/services/job-service";
import { DemoBadge } from "../ui/status-badge";

export function locationLabel(job: { city: string | null; state: string }) {
  return job.city ? `${job.city}, ${job.state}` : job.state;
}

export function JobCard({ job, headingLevel = "h3" }: { job: JobCardData; headingLevel?: "h2" | "h3" }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod);
  const Heading = headingLevel;
  const closingSoon = job.deadline && daysUntil(job.deadline) <= 5;
  return (
    <article className="group relative rounded-lg border border-ink-200 bg-white p-5 shadow-xs transition-shadow hover:border-ink-300 hover:shadow-card sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-brand-700">{job.category.name}</span>
        {job.isDemo && <DemoBadge />}
        {job.featured && !job.isDemo && <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-800">Featured</span>}
      </div>
      <Heading className="mt-2 text-lg font-semibold text-ink-900">
        <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 after:rounded-lg focus:outline-none">
          {job.title}
        </Link>
      </Heading>
      {job.showEmployer && job.employerName && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-700">
          <Building2 aria-hidden className="size-4 text-ink-500" /> {job.employerName}
        </p>
      )}
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">{job.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-700">
        <li className="flex items-center gap-1.5">
          <MapPin aria-hidden className="size-4 text-ink-500" /> {locationLabel(job)}
        </li>
        <li className="flex items-center gap-1.5">
          <Briefcase aria-hidden className="size-4 text-ink-500" /> {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
        </li>
        <li className="flex items-center gap-1.5">
          <Monitor aria-hidden className="size-4 text-ink-500" /> {WORK_ARRANGEMENT_LABEL[job.workArrangement]}
        </li>
        {salary && (
          <li className="flex items-center gap-1.5">
            <Banknote aria-hidden className="size-4 text-ink-500" /> {salary}
          </li>
        )}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 text-xs text-ink-600">
        <span>Posted {job.publishedAt ? formatRelative(job.publishedAt).toLowerCase() : ""}</span>
        {job.deadline && (
          <span className={`flex items-center gap-1 ${closingSoon ? "font-semibold text-warning-700" : ""}`}>
            <CalendarClock aria-hidden className="size-3.5" />
            {closingSoon ? "Closing soon · " : "Apply by "}
            {formatDate(job.deadline)}
          </span>
        )}
      </div>
    </article>
  );
}
