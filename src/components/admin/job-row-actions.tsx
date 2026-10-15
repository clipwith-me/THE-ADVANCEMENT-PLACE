import Link from "next/link";
import { Archive, Eye, Lock, Pencil, RotateCcw, Send, Undo2 } from "lucide-react";
import { jobTransitionAction } from "@/app/admin/actions";
import { ConfirmAction } from "@/components/forms/confirm-action";
import type { JobStatusValue } from "@/lib/domain/labels";

/** Status-dependent lifecycle actions, each behind a confirmation dialog. */
export function JobRowActions({ id, status, compact = true }: { id: string; slug: string; status: JobStatusValue; compact?: boolean }) {
  const t = (transition: string) => ({ id, transition });
  return (
    <div className={`flex flex-wrap items-center gap-1 ${compact ? "md:justify-end" : ""}`}>
      <Link href={`/admin/jobs/${id}/edit`} className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100">
        <Pencil aria-hidden className="size-4" /> Edit
      </Link>
      <Link href={`/admin/jobs/${id}/preview`} className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100">
        <Eye aria-hidden className="size-4" /> Preview
      </Link>
      {status === "DRAFT" && (
        <ConfirmAction
          action={jobTransitionAction}
          hidden={t("publish")}
          trigger={<><Send aria-hidden className="size-4" /> Publish</>}
          triggerVariant="ghost"
          title="Publish this job?"
          body="It will appear on the job board and candidates will be able to apply."
          confirmLabel="Publish"
        />
      )}
      {status === "PUBLISHED" && (
        <>
          <ConfirmAction
            action={jobTransitionAction}
            hidden={t("unpublish")}
            trigger={<><Undo2 aria-hidden className="size-4" /> Unpublish</>}
            triggerVariant="ghost"
            title="Unpublish this job?"
            body="It returns to draft and disappears from the job board. Existing applications are kept."
            confirmLabel="Unpublish"
          />
          <ConfirmAction
            action={jobTransitionAction}
            hidden={t("close")}
            trigger={<><Lock aria-hidden className="size-4" /> Close</>}
            triggerVariant="ghost"
            title="Close applications?"
            body="The job stops accepting applications. Its page shows that the vacancy has closed."
            confirmLabel="Close job"
          />
        </>
      )}
      {(status === "CLOSED" || status === "ARCHIVED") && (
        <ConfirmAction
          action={jobTransitionAction}
          hidden={t("reopen")}
          trigger={<><RotateCcw aria-hidden className="size-4" /> Reopen</>}
          triggerVariant="ghost"
          title="Reopen as draft?"
          body="The job returns to draft so you can update it (for example, the deadline) and publish it again."
          confirmLabel="Reopen as draft"
        />
      )}
      {status !== "ARCHIVED" && (
        <ConfirmAction
          action={jobTransitionAction}
          hidden={t("archive")}
          trigger={<><Archive aria-hidden className="size-4" /> Archive</>}
          triggerVariant="ghost"
          title="Archive this job?"
          body="Archived jobs are hidden everywhere except this dashboard. Applications are kept. You can reopen it later."
          confirmLabel="Archive"
          variant="danger"
        />
      )}
    </div>
  );
}
