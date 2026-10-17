import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2, Circle, Users } from "lucide-react";
import { DataTable, FilterBar, FilterInput, FilterSelect } from "@/components/admin/data-table";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { RejectedBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/domain/format";
import { requireAdmin } from "@/server/auth/current";
import { listCandidates } from "@/server/services/admin-service";

export const metadata = { title: "Candidates" };

type Params = Record<string, string | string[] | undefined>;

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : undefined;
  const complete = params.complete === "yes" || params.complete === "no" ? params.complete : undefined;
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const { items, total, pageCount } = await listCandidates(admin, { q, complete, page });

  return (
    <>
      <PageHeader title="Candidates" description={`${total} candidate account${total === 1 ? "" : "s"}`} />
      <FilterBar action="/admin/candidates">
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Name, email, experience or skill" />
        <FilterSelect
          name="complete"
          label="Profile"
          defaultValue={complete}
          options={[
            { value: "yes", label: "Complete" },
            { value: "no", label: "Incomplete" },
          ]}
        />
      </FilterBar>
      {items.length === 0 ? (
        <EmptyState icon={Users} title={q || complete ? "No candidates match these filters" : "No candidates yet"}>
          {q || complete ? "Try a different search." : "Candidates appear here once they register."}
        </EmptyState>
      ) : (
        <DataTable
          rows={items}
          rowKey={(c) => c.id}
          caption="Candidates"
          primary={(c) => (
            <Link href={`/admin/candidates/${c.id}`} className="hover:underline">
              {c.name}
            </Link>
          )}
          columns={[
            {
              header: "Candidate",
              hideOnMobile: true,
              cell: (c) => (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar photoId={c.profile?.photoId} name={c.name} size="sm" />
                  <div className="min-w-0">
                    <Link href={`/admin/candidates/${c.id}`} className="font-semibold text-ink-900 hover:underline">
                      {c.name}
                    </Link>
                    <p className="truncate text-xs text-ink-500">{c.email}</p>
                  </div>
                </div>
              ),
            },
            { header: "Experience", cell: (c) => <span className="line-clamp-2 text-ink-700">{c.profile?.headline ?? "—"}</span> },
            { header: "Location", cell: (c) => c.profile?.state ?? "—" },
            {
              header: "Profile",
              cell: (c) =>
                c.profile?.completedAt ? (
                  <span className="inline-flex items-center gap-1 text-success-700">
                    <CheckCircle2 aria-hidden className="size-4" /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-ink-500">
                    <Circle aria-hidden className="size-4" /> Incomplete
                  </span>
                ),
            },
            { header: "Applications", cell: (c) => c._count.applications },
            { header: "Joined", cell: (c) => (
              <span className="flex flex-wrap items-center gap-1">
                {formatDate(c.createdAt)} {c.status === "SUSPENDED" && <RejectedBadge />}
              </span>
            ) },
          ]}
        />
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/admin/candidates" params={params} />
    </>
  );
}
