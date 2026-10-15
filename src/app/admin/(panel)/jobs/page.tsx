import Link from "next/link";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { DataTable, FilterBar, FilterInput, FilterSelect } from "@/components/admin/data-table";
import { JobRowActions } from "@/components/admin/job-row-actions";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { DemoBadge, ExpiredBadge, JobStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/domain/format";
import { publicJobState } from "@/lib/domain/job-visibility";
import { JOB_STATUSES, JOB_STATUS_LABEL, type JobStatusValue } from "@/lib/domain/labels";
import { requireAdmin } from "@/server/auth/current";
import { listJobsForAdmin } from "@/server/services/job-service";

export const metadata = { title: "Jobs" };

type Params = Record<string, string | string[] | undefined>;

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : undefined;
  const status = JOB_STATUSES.includes(params.status as JobStatusValue) ? (params.status as JobStatusValue) : undefined;
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const { items, total, pageCount } = await listJobsForAdmin(admin, { q, status, page });

  return (
    <>
      <PageHeader
        title="Jobs"
        description={`${total} job${total === 1 ? "" : "s"}${status ? ` · ${JOB_STATUS_LABEL[status].toLowerCase()}` : ""}`}
        actions={
          <ButtonLink href="/admin/jobs/new">
            <Plus aria-hidden className="size-4" /> New job
          </ButtonLink>
        }
      />
      <FilterBar action="/admin/jobs">
        <FilterInput name="q" label="Search title" defaultValue={q} placeholder="e.g. Accounts Officer" />
        <FilterSelect name="status" label="Status" defaultValue={status} options={JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABEL[s] }))} />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={q || status ? "No jobs match these filters" : "No jobs yet"}
          action={
            <ButtonLink href="/admin/jobs/new">
              <Plus aria-hidden className="size-4" /> Create the first job
            </ButtonLink>
          }
        >
          {q || status ? "Try a different search or status." : "Create a vacancy, save it as a draft, and publish it when it's ready."}
        </EmptyState>
      ) : (
        <DataTable
          rows={items}
          rowKey={(j) => j.id}
          caption="Jobs"
          primary={(j) => (
            <Link href={`/admin/jobs/${j.id}/edit`} className="hover:underline">
              {j.title}
            </Link>
          )}
          columns={[
            {
              header: "Job",
              hideOnMobile: true,
              cell: (j) => (
                <div className="min-w-0">
                  <Link href={`/admin/jobs/${j.id}/edit`} className="font-semibold text-ink-900 hover:underline">
                    {j.title}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {j.category.name} · {j.city ? `${j.city}, ` : ""}
                    {j.state}
                  </p>
                </div>
              ),
            },
            {
              header: "Status",
              cell: (j) => (
                <div className="flex flex-wrap gap-1">
                  <JobStatusBadge status={j.status} />
                  {publicJobState(j) === "EXPIRED" && <ExpiredBadge />}
                  {j.isDemo && <DemoBadge />}
                </div>
              ),
            },
            { header: "Applications", cell: (j) => <Link href={`/admin/applications?job=${j.id}`} className="font-medium text-brand-700 hover:underline">{j._count.applications}</Link> },
            { header: "Deadline", cell: (j) => (j.deadline ? formatDate(j.deadline) : "—") },
            { header: "Updated", cell: (j) => formatDate(j.updatedAt) },
            { header: "Actions", className: "text-right", cell: (j) => <JobRowActions id={j.id} slug={j.slug} status={j.status} /> },
          ]}
        />
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/admin/jobs" params={params} />
    </>
  );
}
