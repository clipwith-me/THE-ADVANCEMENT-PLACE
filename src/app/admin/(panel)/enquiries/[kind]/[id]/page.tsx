import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Mail, MessageCircle, Phone } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextAreaField } from "@/components/forms/fields";
import { Alert } from "@/components/ui/alert";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { EnquiryStatusBadge } from "@/components/ui/status-badge";
import { formatBytes, formatDateTime } from "@/lib/domain/format";
import { ENQUIRY_SLUG_TYPE, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABEL, ENQUIRY_TYPE_LABEL, QUALIFICATION_LABEL } from "@/lib/domain/labels";
import { BUSINESS } from "@/lib/business";
import { isAppError } from "@/lib/errors";
import { requireAdmin } from "@/server/auth/current";
import { getEnquiry } from "@/server/services/enquiry-service";
import { enquiryUpdateAction } from "../../../../actions";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const admin = await requireAdmin();
  const { kind, id } = await params;
  const type = ENQUIRY_SLUG_TYPE[kind];
  if (!type) notFound();
  const e = await getEnquiry(admin, type, id).catch((err) => {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  // Replies open pre-addressed, with a greeting, in the admin's own email or WhatsApp.
  const replySubject = encodeURIComponent(`Re: your ${ENQUIRY_TYPE_LABEL[type].toLowerCase()} enquiry — ${BUSINESS.name}`);
  const greeting = encodeURIComponent(`Hello ${e.name}, thank you for contacting ${BUSINESS.name}. `);
  const wa = e.phone ? `https://wa.me/${e.phone.replace(/\D/g, "")}?text=${greeting}` : null;

  return (
    <>
      <Link href={`/admin/enquiries/${kind}`} className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft aria-hidden className="size-4" /> {ENQUIRY_TYPE_LABEL[type]} enquiries
      </Link>
      <PageHeader title={e.name} description={`Received ${formatDateTime(e.createdAt)}`} actions={<EnquiryStatusBadge status={e.status} />} />
      {!e.notifiedAt && (
        <Alert tone="warning" className="mb-5">
          No email notification was sent for this enquiry (email not configured or delivery failed). It was saved here successfully.
        </Alert>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="card min-w-0 p-5 sm:p-6" aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-base font-semibold">
            Details
          </h2>
          <DefinitionList
            items={[
              ["Email", <a key="m" href={`mailto:${e.email}`} className="link">{e.email}</a>],
              ["Phone", e.phone],
              ["Organisation", e.organization],
              [type === "CAREER_ASSISTANCE" ? "Course of study" : type === "FREELANCE_OUTSOURCING" ? "Service type" : "Subject", e.subject],
              ...(type === "CAREER_ASSISTANCE"
                ? ([
                    ["Qualification", e.qualification ? QUALIFICATION_LABEL[e.qualification] : null],
                    ["Career interests", e.careerInterests],
                  ] as [string, string | null][])
                : []),
              ["Message", <span key="msg" className="whitespace-pre-line">{e.message}</span>],
              [
                "Attachment",
                e.attachment ? (
                  <a href={`/api/files/${e.attachment.id}`} className="link inline-flex items-center gap-1.5">
                    <Download aria-hidden className="size-4" /> {e.attachment.originalName} ({formatBytes(e.attachment.sizeBytes)})
                  </a>
                ) : null,
              ],
            ]}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`mailto:${e.email}?subject=${replySubject}&body=${greeting}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-ink-300 px-3 text-sm font-semibold hover:bg-ink-50">
              <Mail aria-hidden className="size-4" /> Reply by email
            </a>
            {e.phone && (
              <a href={`tel:${e.phone}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-ink-300 px-3 text-sm font-semibold hover:bg-ink-50">
                <Phone aria-hidden className="size-4" /> Call
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-ink-300 px-3 text-sm font-semibold hover:bg-ink-50">
                <MessageCircle aria-hidden className="size-4" /> WhatsApp
              </a>
            )}
          </div>
        </section>
        <aside>
          <section className="card p-5" aria-labelledby="manage-heading">
            <h2 id="manage-heading" className="text-base font-semibold">
              Manage
            </h2>
            <ActionForm action={enquiryUpdateAction} className="mt-4 space-y-4" refreshOnSuccess>
              <input type="hidden" name="id" value={e.id} />
              <SelectField name="status" label="Status" required defaultValue={e.status} options={ENQUIRY_STATUSES.map((s) => ({ value: s, label: ENQUIRY_STATUS_LABEL[s] }))} />
              <TextAreaField name="adminNotes" label="Internal notes" optionalLabel rows={5} maxLength={4000} defaultValue={e.adminNotes} />
              <SubmitButton className="w-full">Save</SubmitButton>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}
