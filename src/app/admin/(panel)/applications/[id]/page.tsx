import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, UserRound } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, SelectField, TextAreaField } from "@/components/forms/fields";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { formatBytes, formatDateTime } from "@/lib/domain/format";
import { ADMIN_SETTABLE_STATUSES, APPLICATION_STATUS_LABEL, NYSC_STATUS_LABEL, type NyscStatusValue } from "@/lib/domain/labels";
import { isAppError } from "@/lib/errors";
import { requireAdmin } from "@/server/auth/current";
import { getApplicationForAdmin } from "@/server/services/application-service";
import { applicationNoteAction, applicationStatusAction } from "../../../actions";

export const metadata = { title: "Application" };

interface Snapshot {
  name?: string;
  email?: string;
  phone?: string | null;
  state?: string | null;
  city?: string | null;
  headline?: string | null;
  qualification?: string | null;
  qualificationDetail?: string | null;
  nyscStatus?: NyscStatusValue | null;
  skills?: string[];
}

export default async function AdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const app = await getApplicationForAdmin(admin, id).catch((e) => {
    if (isAppError(e) && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const s = app.profileSnapshot as Snapshot;
  const withdrawn = app.status === "WITHDRAWN";

  return (
    <>
      <Link href="/admin/applications" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft aria-hidden className="size-4" /> Applications
      </Link>
      <PageHeader
        title={app.candidate.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Applied for{" "}
            <Link href={`/admin/jobs/${app.job.id}/edit`} className="font-medium text-brand-700 hover:underline">
              {app.job.title}
            </Link>
            · {formatDateTime(app.createdAt)}
          </span>
        }
        actions={<ApplicationStatusBadge status={app.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="snapshot-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="snapshot-heading" className="text-base font-semibold">
                Candidate details (as submitted)
              </h2>
              <Link href={`/admin/candidates/${app.candidate.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                <UserRound aria-hidden className="size-4" /> Current profile
              </Link>
            </div>
            <DefinitionList
              items={[
                ["Email", s.email ? <a className="link" href={`mailto:${s.email}`}>{s.email}</a> : null],
                ["Phone", s.phone ? <a className="link" href={`tel:${s.phone}`}>{s.phone}</a> : null],
                ["Location", [s.city, s.state].filter(Boolean).join(", ") || null],
                ["Headline", s.headline],
                ["Qualification", [s.qualification, s.qualificationDetail].filter(Boolean).join(" — ") || null],
                ["NYSC status", s.nyscStatus ? NYSC_STATUS_LABEL[s.nyscStatus] : "Not provided"],
                ["Skills", s.skills?.length ? s.skills.join(", ") : null],
                [
                  "CV",
                  app.cvFile ? (
                    <a href={`/api/files/${app.cvFile.id}`} className="link inline-flex items-center gap-1.5">
                      <Download aria-hidden className="size-4" /> {app.cvFile.originalName} ({formatBytes(app.cvFile.sizeBytes)})
                    </a>
                  ) : (
                    "Not available (deleted under the retention policy)"
                  ),
                ],
              ]}
            />
          </section>

          {app.coverMessage && (
            <section className="card p-5 sm:p-6" aria-labelledby="msg-heading">
              <h2 id="msg-heading" className="text-base font-semibold">
                Message from candidate
              </h2>
              <p className="mt-3 text-sm whitespace-pre-line text-ink-700">{app.coverMessage}</p>
            </section>
          )}

          <section className="card p-5 sm:p-6" aria-labelledby="notes-heading">
            <h2 id="notes-heading" className="text-base font-semibold">
              Internal notes
            </h2>
            <p className="mt-1 text-xs text-ink-500">Visible to administrators only — never shown to the candidate.</p>
            <ActionForm action={applicationNoteAction} className="mt-4" refreshOnSuccess>
              <input type="hidden" name="id" value={app.id} />
              <TextAreaField name="body" label="Add a note" rows={3} maxLength={2000} />
              <SubmitButton variant="secondary" className="mt-3" pendingLabel="Adding…">
                Add note
              </SubmitButton>
            </ActionForm>
            {app.notes.length > 0 && (
              <ul className="mt-5 space-y-3">
                {app.notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-ink-200 bg-ink-50 p-3">
                    <p className="text-sm whitespace-pre-line text-ink-800">{n.body}</p>
                    <p className="mt-1.5 text-xs text-ink-500">
                      {n.author?.name ?? "Former administrator"} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="card p-5" aria-labelledby="status-heading">
            <h2 id="status-heading" className="text-base font-semibold">
              Update status
            </h2>
            {withdrawn ? (
              <p className="mt-2 text-sm text-ink-600">The candidate withdrew this application.</p>
            ) : (
              <ActionForm action={applicationStatusAction} className="mt-4 space-y-4" refreshOnSuccess>
                <input type="hidden" name="id" value={app.id} />
                <SelectField
                  name="status"
                  label="Status"
                  required
                  defaultValue={app.status}
                  options={ADMIN_SETTABLE_STATUSES.map((st) => ({ value: st, label: APPLICATION_STATUS_LABEL[st] }))}
                />
                <CheckboxField name="notify" defaultChecked label="Email the candidate about this change" />
                <SubmitButton className="w-full" pendingLabel="Updating…">
                  Update status
                </SubmitButton>
              </ActionForm>
            )}
          </section>
          <section className="card p-5" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-base font-semibold">
              History
            </h2>
            <ol className="mt-4 space-y-3 border-l-2 border-ink-200 pl-4">
              {app.events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium">{APPLICATION_STATUS_LABEL[e.toStatus]}</p>
                  <p className="text-xs text-ink-500">
                    {formatDateTime(e.createdAt)} · {e.changedBy ? (e.changedBy.role === "ADMIN" ? e.changedBy.name : "Candidate") : "—"}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          <Link href={`/jobs/${app.job.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
            View job advert <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        </aside>
      </div>
    </>
  );
}
