import Link from "next/link";
import { notFound } from "next/navigation";
import { Inbox, Paperclip } from "lucide-react";
import { DataTable, FilterBar, FilterInput, FilterSelect } from "@/components/admin/data-table";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { EnquiryStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/domain/format";
import { ENQUIRY_SLUG_TYPE, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABEL, ENQUIRY_TYPE_LABEL, type EnquiryStatusValue } from "@/lib/domain/labels";
import { requireAdmin } from "@/server/auth/current";
import { listEnquiries } from "@/server/services/enquiry-service";

export const metadata = { title: "Enquiries" };

type Params = Record<string, string | string[] | undefined>;

export default async function EnquiriesPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<Params> }) {
  const admin = await requireAdmin();
  const { kind } = await params;
  const type = ENQUIRY_SLUG_TYPE[kind];
  if (!type) notFound();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const status = ENQUIRY_STATUSES.includes(sp.status as EnquiryStatusValue) ? (sp.status as EnquiryStatusValue) : undefined;
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));
  const { items, total, pageCount } = await listEnquiries(admin, type, { q, status, page });
  const base = `/admin/enquiries/${kind}`;

  return (
    <>
      <PageHeader title={`${ENQUIRY_TYPE_LABEL[type]} enquiries`} description={`${total} enquir${total === 1 ? "y" : "ies"}`} />
      <FilterBar action={base}>
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Name, email or subject" />
        <FilterSelect name="status" label="Status" defaultValue={status} options={ENQUIRY_STATUSES.map((s) => ({ value: s, label: ENQUIRY_STATUS_LABEL[s] }))} />
      </FilterBar>
      {items.length === 0 ? (
        <EmptyState icon={Inbox} title={q || status ? "No enquiries match these filters" : "No enquiries yet"}>
          {q || status ? "Try a different search or status." : "Submissions from the website form will appear here."}
        </EmptyState>
      ) : (
        <DataTable
          rows={items}
          rowKey={(e) => e.id}
          caption="Enquiries"
          primary={(e) => (
            <Link href={`${base}/${e.id}`} className="hover:underline">
              {e.name}
            </Link>
          )}
          columns={[
            {
              header: "From",
              hideOnMobile: true,
              cell: (e) => (
                <div className="min-w-0">
                  <Link href={`${base}/${e.id}`} className="font-semibold text-ink-900 hover:underline">
                    {e.name}
                  </Link>
                  <p className="truncate text-xs text-ink-500">{e.email}</p>
                </div>
              ),
            },
            {
              header: type === "CAREER_ASSISTANCE" ? "Course" : type === "FREELANCE_OUTSOURCING" ? "Service" : "Subject",
              cell: (e) => (
                <span className="inline-flex items-center gap-1.5">
                  <span className="line-clamp-2">{e.subject ?? "—"}</span>
                  {e.attachmentId && <Paperclip aria-label="Has attachment" className="size-4 shrink-0 text-ink-500" />}
                </span>
              ),
            },
            { header: "Status", cell: (e) => <EnquiryStatusBadge status={e.status} /> },
            { header: "Received", cell: (e) => formatDate(e.createdAt) },
          ]}
        />
      )}
      <Pagination page={page} pageCount={pageCount} basePath={base} params={sp} />
    </>
  );
}
