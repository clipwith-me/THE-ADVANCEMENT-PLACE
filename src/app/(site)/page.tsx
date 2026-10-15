import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock,
  FileCheck2,
  Handshake,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircle,
  Search,
  Send,
  UserRoundCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { JobSearchBar } from "@/components/jobs/job-search-bar";
import { LogoMark } from "@/components/site/logo";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ADDRESS_ONE_LINE, BUSINESS, whatsappUrl } from "@/lib/business";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import { pageMetadata } from "@/lib/seo";
import { categoriesWithCounts, latestJobs, liveJobCount } from "@/server/services/job-service";

export const metadata = {
  ...pageMetadata({
    title: "Jobs, Recruitment & Career Services in Nigeria",
    description:
      "Find job vacancies, build your professional profile and take the next step in your career with The Advancement Place — recruitment and career services in Abeokuta, Ogun State.",
    path: "/",
  }),
  title: { absolute: `${BUSINESS.name} — Find Opportunities. Advance Your Career.` },
};

const steps = [
  { icon: UserRoundPlus, title: "Create your account", body: "Sign up with your email in under a minute." },
  { icon: UserRoundCheck, title: "Complete your profile", body: "Add your qualification, skills and CV so employers see your best." },
  { icon: Search, title: "Find the right role", body: "Search and filter vacancies by type, location and category." },
  { icon: Send, title: "Apply and track", body: "Apply with one click and follow every application from your dashboard." },
];

export default async function HomePage() {
  const [jobs, liveCount, categories] = await Promise.all([latestJobs(6), liveJobCount(), categoriesWithCounts()]);
  const topCategories = categories.filter((c) => c.liveCount > 0).slice(0, 8);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 hidden opacity-[0.07] lg:block">
          <LogoMark className="h-[34rem] w-auto" />
        </div>
        <div className="container-page relative grid gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <p className="eyebrow">Recruitment &amp; career services · Abeokuta, Ogun State</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Find opportunities.
              <br />
              <span className="text-brand-700">Advance your career.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">
              Discover job opportunities, build your professional profile, and take the next step in your career with{" "}
              {BUSINESS.name}.
            </p>
            <div className="mt-8 max-w-2xl">
              <JobSearchBar />
            </div>
            <p className="mt-4 text-sm text-ink-600">
              {liveCount > 0 ? (
                <>
                  <strong className="font-semibold text-ink-900">{liveCount}</strong> open{" "}
                  {liveCount === 1 ? "vacancy" : "vacancies"} right now ·{" "}
                </>
              ) : null}
              Popular:{" "}
              {EMPLOYMENT_TYPES.slice(0, 3).map((t, i) => (
                <span key={t}>
                  {i > 0 && ", "}
                  <Link href={`/jobs?type=${t}`} className="link">
                    {EMPLOYMENT_TYPE_LABEL[t]}
                  </Link>
                </span>
              ))}
              {", "}
              <Link href="/jobs?arrangement=REMOTE" className="link">
                Remote
              </Link>
            </p>
          </div>

          <div className="lg:col-span-5 lg:pl-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <PathCard
                icon={BriefcaseBusiness}
                title="Looking for a job?"
                body="Create a free account, complete your profile and apply for vacancies."
                href="/register"
                cta="Create your account"
              />
              <PathCard
                icon={Lightbulb}
                title="Need career guidance?"
                body="Tell us about your background and goals and our team will be in touch."
                href="/career-assistance"
                cta="Get career assistance"
              />
              <PathCard
                icon={Building2}
                title="Hiring or outsourcing?"
                body="Send us your vacancy, freelance requirement or project proposal."
                href="/freelance-outsourcing"
                cta="Make an enquiry"
                className="sm:col-span-2 lg:col-span-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest vacancies ─────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="latest-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Latest vacancies</p>
            <h2 id="latest-heading" className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Recently published opportunities
            </h2>
          </div>
          {jobs.length > 0 && (
            <Link href="/jobs" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
              View all jobs <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>
        <div className="mt-8">
          {jobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BriefcaseBusiness}
              title="New vacancies are on the way"
              action={<ButtonLink href="/register">Create an account to be ready</ButtonLink>}
            >
              There are no open vacancies at this moment. Create your profile now so you can apply as soon as new roles are published.
            </EmptyState>
          )}
        </div>
      </section>

      {/* ── Categories & opportunity types ───────────────────────────────── */}
      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20" aria-labelledby="types-heading">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Opportunity types</p>
            <h2 id="types-heading" className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Roles that fit how you want to work
            </h2>
            <p className="mt-3 text-ink-600">
              We publish full-time and part-time vacancies, and the board also supports contract, internship, temporary and remote roles.
            </p>
          </div>
          <div className="lg:col-span-8">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {EMPLOYMENT_TYPES.map((t) => (
                <li key={t}>
                  <Link
                    href={`/jobs?type=${t}`}
                    className="flex min-h-14 items-center justify-between rounded-lg border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    {EMPLOYMENT_TYPE_LABEL[t]} <ArrowRight aria-hidden className="size-4 text-brand-700" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/jobs?arrangement=REMOTE"
                  className="flex min-h-14 items-center justify-between rounded-lg border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  Remote <ArrowRight aria-hidden className="size-4 text-brand-700" />
                </Link>
              </li>
            </ul>
            {topCategories.length > 0 && (
              <>
                <h3 className="mt-8 text-sm font-semibold text-ink-900">Browse by category</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {topCategories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/jobs?category=${c.slug}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm text-ink-800 hover:border-brand-300"
                      >
                        {c.name} <span className="text-xs font-semibold text-ink-500">{c.liveCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="mt-2 font-display text-3xl font-semibold tracking-tight">
            From sign-up to application in four steps
          </h2>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-lg bg-ink-900 text-white">
                  <s.icon aria-hidden className="size-5" />
                </span>
                <span className="text-sm font-semibold text-brand-700">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <ButtonLink href="/register" size="lg">
            Get started <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="bg-ink-900 py-16 text-white sm:py-20" aria-labelledby="services-heading">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-300 uppercase">Our services</p>
            <h2 id="services-heading" className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Support for candidates, employers and projects
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <ServiceCard
              icon={Lightbulb}
              title="Career assistance"
              body="Guidance for graduates and job seekers on job placement and the next step in your career. Share your background and interests and we'll follow up."
              href="/career-assistance"
              cta="Request career assistance"
            />
            <ServiceCard
              icon={Users}
              title="Recruitment for employers"
              body="Have a vacancy to fill? Tell us about the role and our team will discuss how we can help you reach suitable candidates."
              href="/contact?topic=Recruitment%20services"
              cta="Discuss a vacancy"
            />
            <ServiceCard
              icon={Handshake}
              title="Freelance & outsourcing"
              body="Enquire about freelance opportunities, or send an outsourcing request or project proposal through our enquiry form or by email."
              href="/freelance-outsourcing"
              cta="Send an enquiry"
            />
          </div>
        </div>
      </section>

      {/* ── Trust: verified facts only ───────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="trust-heading">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Why candidates trust us</p>
            <h2 id="trust-heading" className="mt-2 font-display text-3xl font-semibold tracking-tight">
              A real office, real people and a clear process
            </h2>
            <p className="mt-3 text-ink-600">
              Visit us, call us or message us — and know exactly how your information is handled.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <TrustItem icon={MapPin} title="Visit our office">
              {ADDRESS_ONE_LINE}
            </TrustItem>
            <TrustItem icon={Clock} title="Opening hours">
              {BUSINESS.hours.map((h) => (
                <span key={h.days} className="block">
                  {h.days}: {h.time}
                </span>
              ))}
            </TrustItem>
            <TrustItem icon={Lock} title="Your CV stays private">
              CVs are stored privately and are only visible to you and our recruitment team — never published.
            </TrustItem>
            <TrustItem icon={FileCheck2} title="Track every application">
              See the status of each application you submit from your personal dashboard.
            </TrustItem>
          </ul>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-white sm:px-12">
          <div aria-hidden className="absolute -right-10 -bottom-16 opacity-15">
            <LogoMark className="h-72 w-auto brightness-0 invert" />
          </div>
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Ready to take the next step?</h2>
            <p className="mt-3 text-lg text-brand-50">
              Create your profile today, or talk to our team about career assistance, recruitment or outsourcing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg" variant="secondary">
                Create your account
              </ButtonLink>
              <a
                href={whatsappUrl("Hello The Advancement Place, I'd like to make an enquiry.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/40 px-6 font-semibold text-white hover:bg-white/10"
              >
                <MessageCircle aria-hidden className="size-5" /> Chat on WhatsApp
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PathCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
  className = "",
}: {
  icon: typeof Search;
  title: string;
  body: string;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card ${className}`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink-900">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-ink-600">{body}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          {cta} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function ServiceCard({ icon: Icon, title, body, href, cta }: { icon: typeof Search; title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-6">
      <Icon aria-hidden className="size-7 text-brand-300" />
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-300">{body}</p>
      <Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200">
        {cta} <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

function TrustItem({ icon: Icon, title, children }: { icon: typeof Search; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-ink-200 bg-white p-5">
      <Icon aria-hidden className="size-5 text-brand-700" />
      <h3 className="mt-3 text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">{children}</p>
    </li>
  );
}
