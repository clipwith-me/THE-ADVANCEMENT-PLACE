import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { JobDetail } from "@/components/jobs/job-detail";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/ui/status-badge";
import { isAppError } from "@/lib/errors";
import { requireAdmin } from "@/server/auth/current";
import { getJobForAdmin } from "@/server/services/job-service";

export const metadata = { title: "Preview job" };

export default async function PreviewJobPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const job = await getJobForAdmin(admin, id).catch((e) => {
    if (isAppError(e) && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/jobs/${job.id}/edit`} className="inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
          <ArrowLeft aria-hidden className="size-4" /> Back to editor
        </Link>
        <JobStatusBadge status={job.status} />
      </div>
      <Alert tone="info" title="Preview" className="mb-2">
        This is how the vacancy will look to candidates.
      </Alert>
      <div className="-mx-4 overflow-hidden rounded-lg border border-ink-200 bg-white sm:mx-0">
        <JobDetail
          job={job}
          applyPanel={
            <ButtonLink href={`/admin/jobs/${job.id}/edit`} variant="dark" className="w-full">
              <Pencil aria-hidden className="size-4" /> Edit vacancy
            </ButtonLink>
          }
        />
      </div>
    </>
  );
}
