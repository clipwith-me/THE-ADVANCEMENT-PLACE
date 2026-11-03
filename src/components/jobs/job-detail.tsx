import type { ReactNode } from "react";
import {
  Banknote,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  Download,
  GraduationCap,
  Lock,
  LogIn,
  MapPin,
  Maximize2,
  Monitor,
  Tag,
  UserPlus,
} from "lucide-react";
import { EMPLOYMENT_TYPE_LABEL, WORK_ARRANGEMENT_LABEL } from "@/lib/domain/labels";
import { formatDate, formatExperience, formatSalary } from "@/lib/domain/format";
import type { PublicJob } from "@/server/services/job-service";
import { ButtonLink } from "../ui/button";
import { DemoBadge } from "../ui/status-badge";
import { locationLabel } from "./job-card";

/** Plain text → paragraphs. Content is rendered as text (escaped), never as HTML. */
export function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-plain text-[0.95rem] leading-relaxed text-ink-700">
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
    </div>
  );
}

/** Shown in place of the full job details to signed-out visitors. */
function LockedDetails({ href }: { href?: { register: string; login: string } }) {
  return (
    <section className="relative mt-8" aria-labelledby="locked-heading">
      {/* Decorative placeholder lines only — no real job content is rendered here. */}
      <div aria-hidden className="space-y-3 opacity-60 blur-[3px] select-none">
        {[100, 92, 97, 60, 88, 95, 70].map((w, i) => (
          <div key={i} className="h-3.5 rounded-full bg-ink-200" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="relative -mt-24 rounded-xl border border-brand-200 bg-white/95 p-6 text-center shadow-card sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Lock aria-hidden className="size-6" />
        </span>
        <h2 id="locked-heading" className="mt-4 text-xl font-semibold text-ink-900">
          Sign up to see the full job
        </h2>
        <p className="mx-auto mt-2 max-w-md text-ink-600">
          Create a free account to read the full description, requirements, salary and how to apply. It only takes a minute.
        </p>
        {href && (
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={href.register} size="lg">
              <UserPlus aria-hidden className="size-4" /> Create free account
            </ButtonLink>
            <ButtonLink href={href.login} size="lg" variant="secondary">
              <LogIn aria-hidden className="size-4" /> Sign in
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

/** The vacancy's flyer: images are shown inline (tap to open full size); PDFs download. */
function JobFlyer({ flyer, title }: { flyer: NonNullable<PublicJob["flyer"]>; title: string }) {
  const href = `/media/${flyer.id}`;
  if (!flyer.mimeType.startsWith("image/")) {
    return (
      <a href={href} className="mt-6 flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-4 hover:border-brand-300">
        <Download aria-hidden className="size-5 shrink-0 text-brand-700" />
        <span>
          <span className="block font-semibold text-ink-900">Download the job flyer</span>
          <span className="text-sm text-ink-600">PDF</span>
        </span>
      </a>
    );
  }
  return (
    <figure className="mt-6">
      <a href={href} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- already resized on upload */}
        <img src={href} alt={`Flyer for ${title}`} loading="lazy" decoding="async" className="mx-auto max-h-[36rem] w-auto object-contain" />
      </a>
      <figcaption className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
        <Maximize2 aria-hidden className="size-4" /> Tap the flyer to open it full size<span className="sr-only"> (opens in a new tab)</span>
      </figcaption>
    </figure>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-700">
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * `locked` is the signed-out preview: title, basics and summary only. The
 * description, requirements, pay, flyer and instructions need an account
 * (client requirement). Locked content is never sent to the browser.
 */
export function JobDetail({
  job,
  applyPanel,
  banner,
  locked = false,
  unlockHref,
}: {
  job: PublicJob;
  applyPanel: ReactNode;
  banner?: ReactNode;
  locked?: boolean;
  unlockHref?: { register: string; login: string };
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod);
  const experience = formatExperience(job.experienceYearsMin, job.experienceYearsMax);
  const facts: [typeof MapPin, string, string | null][] = [
    [Briefcase, "Employment type", EMPLOYMENT_TYPE_LABEL[job.employmentType]],
    [Monitor, "Work arrangement", WORK_ARRANGEMENT_LABEL[job.workArrangement]],
    [MapPin, "Location", locationLabel(job)],
    [Banknote, "Salary", locked ? null : (salary ?? "Not disclosed")],
    [GraduationCap, "Experience", locked ? null : experience],
    [Tag, "Category", job.category.name],
    [CalendarDays, "Posted", job.publishedAt ? formatDate(job.publishedAt) : null],
    [CalendarClock, "Application deadline", job.deadline ? formatDate(job.deadline) : "Open until filled"],
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      {banner}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{job.category.name}</span>
            {job.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{job.title}</h1>
          {job.showEmployer && job.employerName && (
            <p className="mt-3 flex items-center gap-2 text-base text-ink-700">
              <Building2 aria-hidden className="size-5 text-ink-500" /> {job.employerName}
            </p>
          )}
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            <li className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</li>
            <li className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">{WORK_ARRANGEMENT_LABEL[job.workArrangement]}</li>
            <li className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">{locationLabel(job)}</li>
          </ul>

          <p className="mt-6 text-lg leading-relaxed text-ink-800">{job.summary}</p>

          {locked ? (
            <LockedDetails href={unlockHref} />
          ) : (
            <>
              {job.flyer && <JobFlyer flyer={job.flyer} title={job.title} />}

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-ink-900">About the role</h2>
                <div className="mt-3">
                  <Paragraphs text={job.description} />
                </div>
              </section>
              <Section title="Responsibilities" items={job.responsibilities} />
              <Section title="Requirements" items={job.requirements} />
              <Section title="Qualifications" items={job.qualifications} />

              {job.skills.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-ink-900">Relevant skills</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <li key={s} className="rounded-md border border-ink-200 bg-ink-50 px-2.5 py-1 text-sm text-ink-800">
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {job.applyInstructions && (
                <section className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-5">
                  <h2 className="text-base font-semibold text-ink-900">How to apply</h2>
                  <div className="mt-2">
                    <Paragraphs text={job.applyInstructions} />
                  </div>
                </section>
              )}
            </>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Job summary">
          <div className="card p-5 sm:p-6">
            {applyPanel}
            <dl className={locked ? "space-y-4 lg:mt-6 lg:border-t lg:border-ink-100 lg:pt-6" : "mt-6 space-y-4 border-t border-ink-100 pt-6"}>
              {facts
                .filter(([, , v]) => v)
                .map(([Icon, k, v]) => (
                  <div key={k} className="flex gap-3">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
                    <div>
                      <dt className="text-xs font-medium text-ink-600">{k}</dt>
                      <dd className="text-sm font-medium text-ink-900">{v}</dd>
                    </div>
                  </div>
                ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
