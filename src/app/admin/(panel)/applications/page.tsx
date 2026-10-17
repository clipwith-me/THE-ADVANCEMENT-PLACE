import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Download, FileText } from "lucide-react";
import { DataTable, FilterBar, FilterInput, FilterSelect } from "@/components/admin/data-table";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/domain/format";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL, type ApplicationStatusValue } from "@/lib/domain/labels";
import { requireAdmin } from "@/server/auth/current";
import { listApplicationsForAdmin } from "@/server/services/application-service";

export const metadata = { title: "Applications" };

type Params = Record<string, string | string[] | undefined>;

export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : undefined;
  const status = APPLICATION_STATUSES.includes(params.status as ApplicationStatusValue) ? (params.status as ApplicationStatusValue) : undefined;
  const jobId = typeof params.job === "string" && /^[a-z0-9]{10,40}$/i.test(params.job) ? params.job : undefined;
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const { items, total, pageCount } = await listApplicationsForAdmin(admin, { q, status, jobId, page });

  return (
    <>
      <PageHeader title="Applications" description={`${total} application${total === 1 ? "" : "s"}${jobId ? " for the selected job" : ""}`} />
      <FilterBar action="/admin/applications">
        {jobId && <input type="hidden" name="job" value={jobId} />}
        <FilterInput name="q" label="Search candidate or job" defaultValue={q} placeholder="Name, email or job title" />
        <FilterSelect
          name="status"
          label="Status"
          defaultValue={status}
          options={APPLICATION_STATUSES.map((s) => ({ value: s, label: APPLICATION_STATUS_LABEL[s] }))}
        />
      </FilterBar>
      {jobId && (
        <p className="-mt-2 mb-4 text-sm">
          Filtered by job ·{" "}
          <Link href="/admin/applications" className="link">
            Show all jobs
          </Link>
        </p>
      )}
      {items.length === 0 ? (
        <EmptyState icon={FileText} title={q || status || jobId ? "No applications match these filters" : "No applications yet"}>
          {q || status || jobId ? "Try a different search or status." : "Applications appear here when candidates apply for published jobs."}
        </EmptyState>
      ) : (
        <DataTable
          rows={items}
          rowKey={(a) => a.id}
          caption="Applications"
          primary={(a) => (
            <Link href={`/admin/applications/${a.id}`} className="hover:underline">
              {a.candidate.name}
            </Link>
          )}
          columns={[
            {
              header: "Candidate",
              hideOnMobile: true,
              cell: (a) => (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar photoId={a.photoFile?.id} name={a.candidate.name} size="sm" />
                  <div className="min-w-0">
                    <Link href={`/admin/applications/${a.id}`} className="font-semibold text-ink-900 hover:underline">
                      {a.candidate.name}
                    </Link>
                    <p className="truncate text-xs text-ink-500">{a.candidate.email}</p>
                  </div>
                </div>
              ),
            },
            { header: "Job", cell: (a) => <span className="line-clamp-2">{a.job.title}</span> },
            { header: "Status", cell: (a) => <ApplicationStatusBadge status={a.status} /> },
            { header: "Applied", cell: (a) => formatDate(a.createdAt) },
            {
              header: "CV",
              cell: (a) =>
                a.cvFile ? (
                  <a href={`/api/files/${a.cvFile.id}`} className="inline-flex min-h-10 items-center gap-1 font-medium text-brand-700 hover:underline">
                    <Download aria-hidden className="size-4" /> Download<span className="sr-only"> CV of {a.candidate.name}</span>
                  </a>
                ) : (
                  <span className="text-ink-500">—</span>
                ),
            },
          ]}
        />
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/admin/applications" params={params} />
    </>
  );
}
