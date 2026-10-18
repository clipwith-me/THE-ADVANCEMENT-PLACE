import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FilePen, FileText, Inbox, Plus, UserCheck, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatRelative } from "@/lib/domain/format";
import { requireAdmin } from "@/server/auth/current";
import { dashboardMetrics } from "@/server/services/admin-service";

export const metadata = { title: "Overview" };

const weekLabel = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

export default async function AdminOverview() {
  const admin = await requireAdmin();
  const m = await dashboardMetrics(admin);
  const max = Math.max(1, ...m.weekly.map((w) => w.count));
  const weeklyTotal = m.weekly.reduce((n, w) => n + w.count, 0);

  const tiles = [
    { label: "Registered candidates", value: m.candidates, sub: `${m.completeProfiles} with complete profiles`, icon: Users, href: "/admin/candidates" },
    { label: "Live vacancies", value: m.liveJobs, sub: `${m.draftJobs} draft${m.draftJobs === 1 ? "" : "s"}`, icon: BriefcaseBusiness, href: "/admin/jobs" },
    { label: "Total applications", value: m.totalApplications, sub: "All time", icon: FileText, href: "/admin/applications" },
    { label: "Awaiting review", value: m.needsReview, sub: "Submitted or under review", icon: UserCheck, href: "/admin/applications?status=SUBMITTED" },
    { label: "New enquiries", value: m.newEnquiries, sub: "Across all enquiry types", icon: Inbox, href: "/admin/enquiries/career" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Welcome back, ${admin.name.split(" ")[0]}. All figures are live from the database.`}
        actions={
          <ButtonLink href="/admin/jobs/new">
            <Plus aria-hidden className="size-4" /> New job
          </ButtonLink>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="card block h-full p-5 transition-shadow hover:shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-600">{t.label}</p>
                <t.icon aria-hidden className="size-4 text-brand-700" />
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{t.value.toLocaleString("en-NG")}</p>
              <p className="mt-1 text-xs text-ink-500">{t.sub}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <section className="card p-5 sm:p-6 xl:col-span-3" aria-labelledby="chart-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="chart-heading" className="text-base font-semibold">
              Applications per week
            </h2>
            <span className="text-xs text-ink-500">Last 8 weeks · {weeklyTotal} total</span>
          </div>
          {weeklyTotal === 0 ? (
            <p className="mt-10 mb-6 text-center text-sm text-ink-500">No applications in the last eight weeks.</p>
          ) : (
            <figure className="mt-6">
              <div className="flex h-44 items-end gap-2 sm:gap-3" aria-hidden>
                {m.weekly.map((w) => (
                  <div key={w.start.toISOString()} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-xs font-medium text-ink-700">{w.count || ""}</span>
                    <div className="w-full rounded-t bg-brand-400" style={{ height: `${Math.max(2, (w.count / max) * 140)}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden>
                {m.weekly.map((w) => (
                  <span key={w.start.toISOString()} className="flex-1 text-center text-[0.65rem] text-ink-500">
                    {weekLabel.format(w.start)}
                  </span>
                ))}
              </div>
              {/* Accessible equivalent of the chart. */}
              {/* Wrapped: tables ignore the sr-only clip and would widen the page. */}
              <div className="sr-only">
                <table>
                  <caption>Applications per week, last eight weeks</caption>
                  <tbody>
                    {m.weekly.map((w) => (
                      <tr key={w.start.toISOString()}>
                        <th scope="row">Week of {formatDate(w.start)}</th>
                        <td>{w.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </figure>
          )}
        </section>

        <section className="card p-5 sm:p-6 xl:col-span-2" aria-labelledby="recent-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-base font-semibold">
              Recent applications
            </h2>
            <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              All <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>
          {m.recentApps.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {m.recentApps.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/applications/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-ink-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{a.candidate.name}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {a.job.title} · {formatRelative(a.createdAt)}
                      </span>
                    </span>
                    <ApplicationStatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState icon={FilePen} title="No applications yet">
                Applications will appear here as candidates apply.
              </EmptyState>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
