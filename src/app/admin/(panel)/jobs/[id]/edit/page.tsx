import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { JobForm } from "@/components/admin/job-form";
import { JobRowActions } from "@/components/admin/job-row-actions";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/misc";
import { DemoBadge, ExpiredBadge, JobStatusBadge } from "@/components/ui/status-badge";
import { publicJobState } from "@/lib/domain/job-visibility";
import { isAppError } from "@/lib/errors";
import { requireAdmin } from "@/server/auth/current";
import { getJobForAdmin, listCategories } from "@/server/services/job-service";
import { updateJobAction } from "../../../../actions";

export const metadata = { title: "Edit job" };

export default async function EditJobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const [job, categories] = await Promise.all([
    getJobForAdmin(admin, id).catch((e) => {
      if (isAppError(e) && e.code === "NOT_FOUND") notFound();
      throw e;
    }),
    listCategories(),
  ]);
  const state = publicJobState(job);

  return (
    <>
      <Link href="/admin/jobs" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft aria-hidden className="size-4" /> Jobs
      </Link>
      <PageHeader
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            {state === "EXPIRED" && <ExpiredBadge />}
            {job.isDemo && <DemoBadge />}
            <Link href={`/admin/applications?job=${job.id}`} className="text-sm font-medium text-brand-700 hover:underline">
              {job._count.applications} application{job._count.applications === 1 ? "" : "s"}
            </Link>
            {state === "LIVE" && (
              <Link href={`/jobs/${job.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline" target="_blank">
                Public page <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            )}
          </span>
        }
      />
      {saved && (
        <Alert tone="success" title={saved === "publish" ? "Job created and published." : "Draft saved."} className="mb-5" live>
          {saved === "draft" && "Preview it, then publish when it's ready."}
        </Alert>
      )}
      {state === "EXPIRED" && (
        <Alert tone="warning" title="The deadline has passed" className="mb-5">
          This job is no longer shown on the job board. Set a new deadline and save to make it live again, or close it.
        </Alert>
      )}
      <div className="mb-6 rounded-lg border border-ink-200 bg-white p-2">
        <JobRowActions id={job.id} slug={job.slug} status={job.status} compact={false} />
      </div>
      <JobForm action={updateJobAction} job={job} categories={categories} mode="edit" />
    </>
  );
}
