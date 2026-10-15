import { History } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/domain/format";
import { requireAdmin } from "@/server/auth/current";
import { recentAudit } from "@/server/services/admin-service";

export const metadata = { title: "Activity log" };

export default async function ActivityPage() {
  const admin = await requireAdmin();
  const events = await recentAudit(admin, 100);
  return (
    <>
      <PageHeader title="Activity log" description="The latest 100 security and administrative events. The log is append-only." />
      {events.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" />
      ) : (
        <ol className="card divide-y divide-ink-100">
          {events.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">
                <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{e.action}</code>{" "}
                <span className="text-ink-700">
                  {e.entityType}
                  {e.entityId ? ` · ${e.entityId.slice(0, 10)}…` : ""}
                </span>
              </span>
              <span className="text-xs text-ink-500">
                {e.actor?.name ?? "System / anonymous"} · {formatDateTime(e.createdAt)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
