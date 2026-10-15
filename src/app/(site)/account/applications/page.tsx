import Link from "next/link";
import { BriefcaseBusiness, ChevronRight, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { locationLabel } from "@/components/jobs/job-card";
import { formatDate } from "@/lib/domain/format";
import { privateMetadata } from "@/lib/seo";
import { requireCandidate } from "@/server/auth/current";
import { listMyApplications } from "@/server/services/application-service";

export const metadata = privateMetadata("My applications");

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireCandidate();
  const params = await searchParams;
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const { items, total, pageCount } = await listMyApplications(user, page);

  return (
    <>
      <PageHeader
        title="My applications"
        description={total > 0 ? `You have submitted ${total} application${total === 1 ? "" : "s"}.` : "Track the status of every job you apply for."}
        actions={
          <ButtonLink href="/jobs" variant="secondary">
            <Search aria-hidden className="size-4" /> Find jobs
          </ButtonLink>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} title="You haven't applied for any jobs yet" action={<ButtonLink href="/jobs">Browse vacancies</ButtonLink>}>
          When you apply for a vacancy, it will appear here with its current status.
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-ink-100 overflow-hidden">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/account/applications/${a.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-ink-50 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{a.job.title}</p>
                  <p className="mt-0.5 text-sm text-ink-600">
                    {locationLabel(a.job)} · Applied {formatDate(a.createdAt)}
                  </p>
                  <div className="mt-2 sm:hidden">
                    <ApplicationStatusBadge status={a.status} />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <ApplicationStatusBadge status={a.status} />
                </div>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/account/applications" params={params} />
    </>
  );
}
