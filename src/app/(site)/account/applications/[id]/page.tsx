import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Undo2 } from "lucide-react";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Alert } from "@/components/ui/alert";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { DefinitionList } from "@/components/ui/misc";
import { locationLabel } from "@/components/jobs/job-card";
import { formatDate, formatDateTime } from "@/lib/domain/format";
import { publicJobState } from "@/lib/domain/job-visibility";
import { APPLICATION_STATUS_LABEL, EMPLOYMENT_TYPE_LABEL, FINAL_APPLICATION_STATUSES } from "@/lib/domain/labels";
import { isAppError } from "@/lib/errors";
import { privateMetadata } from "@/lib/seo";
import { requireCandidate } from "@/server/auth/current";
import { getMyApplication } from "@/server/services/application-service";
import { withdrawApplicationAction } from "../../actions";

export const metadata = privateMetadata("Application");

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; emailed?: string }>;
}) {
  const user = await requireCandidate();
  const { id } = await params;
  const { submitted, emailed } = await searchParams;
  const app = await getMyApplication(user, id).catch((e) => {
    if (isAppError(e) && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const jobPublic = publicJobState(app.job) !== "HIDDEN";
  const canWithdraw = !FINAL_APPLICATION_STATUSES.includes(app.status);

  return (
    <div className="space-y-6">
      <Link href="/account/applications" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft aria-hidden className="size-4" /> All applications
      </Link>

      {submitted && (
        <Alert tone="success" title="Application submitted" live>
          {emailed === "1"
            ? "We've emailed you a confirmation. You can follow the status of your application here."
            : "Your application has been received. We couldn't send a confirmation email this time, but you can follow its status here."}
        </Alert>
      )}

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-ink-600">Application for</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{app.job.title}</h1>
            <p className="mt-1 text-sm text-ink-600">
              {locationLabel(app.job)} · {EMPLOYMENT_TYPE_LABEL[app.job.employmentType]}
            </p>
          </div>
          <ApplicationStatusBadge status={app.status} />
        </div>
        <div className="mt-6">
          <DefinitionList
            items={[
              ["Submitted", formatDateTime(app.createdAt)],
              [
                "CV submitted",
                app.cvFile ? (
                  <a href={`/api/files/${app.cvFile.id}`} className="link inline-flex items-center gap-1.5">
                    <Download aria-hidden className="size-4" /> {app.cvFile.originalName}
                  </a>
                ) : (
                  "No longer stored"
                ),
              ],
              ["Your message", app.coverMessage ? <span className="whitespace-pre-line">{app.coverMessage}</span> : null],
              [
                "Vacancy",
                jobPublic ? (
                  <Link href={`/jobs/${app.job.slug}`} className="link inline-flex items-center gap-1.5">
                    View job advert <ExternalLink aria-hidden className="size-3.5" />
                  </Link>
                ) : (
                  "This vacancy is no longer published"
                ),
              ],
            ]}
          />
        </div>
      </div>

      <section className="card p-5 sm:p-6" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-lg font-semibold">
          Status history
        </h2>
        <ol className="mt-4 space-y-4 border-l-2 border-ink-200 pl-5">
          {app.events.map((e, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute top-1.5 -left-[1.6rem] size-3 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-300" />
              <p className="font-medium text-ink-900">{APPLICATION_STATUS_LABEL[e.toStatus]}</p>
              <p className="text-sm text-ink-600">{formatDate(e.createdAt)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-ink-600">
          Statuses are updated by our recruitment team as your application progresses. Being shortlisted or invited to interview is not a
          job offer.
        </p>
      </section>

      {canWithdraw && (
        <div className="flex justify-end">
          <ConfirmAction
            action={withdrawApplicationAction}
            hidden={{ id: app.id }}
            trigger={
              <>
                <Undo2 aria-hidden className="size-4" /> Withdraw application
              </>
            }
            title="Withdraw this application?"
            body="Our team will no longer consider you for this vacancy. You can't re-apply for the same vacancy after withdrawing."
            confirmLabel="Withdraw application"
            variant="danger"
          />
        </div>
      )}
    </div>
  );
}
