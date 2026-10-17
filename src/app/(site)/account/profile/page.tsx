import { Briefcase, GraduationCap, Trash2 } from "lucide-react";
import { CompletenessCard, CoreProfileFields, CurrentCv, qualificationOptions } from "@/components/account/profile-parts";
import { CvUploadForm } from "@/components/account/cv-upload-form";
import { PhotoUploadForm } from "@/components/account/photo-upload-form";
import { Avatar } from "@/components/ui/avatar";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { PageHeader } from "@/components/ui/misc";
import { QUALIFICATION_LABEL } from "@/lib/domain/labels";
import { env } from "@/lib/env";
import { privateMetadata } from "@/lib/seo";
import { requireCandidate } from "@/server/auth/current";
import { getCompleteness } from "@/server/services/profile-service";
import {
  addEducationAction,
  addExperienceAction,
  removeCvAction,
  removePhotoAction,
  removeEducationAction,
  removeExperienceAction,
  saveFullProfileAction,
} from "../actions";

export const metadata = privateMetadata("Profile & CV");

const monthYear = new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function ProfilePage() {
  const user = await requireCandidate();
  const { bundle, result } = await getCompleteness(user.id);
  const p = bundle.profile!;

  return (
    <>
      <PageHeader title="Profile & CV" description="Keep your profile up to date — it's shared with our recruitment team when you apply." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="photo-heading">
            <h2 id="photo-heading" className="text-lg font-semibold">
              Passport photograph
            </h2>
            <p className="mt-1 mb-5 text-sm text-ink-600">
              Helps our recruitment team identify you. Only you and our staff can see it. Applications keep the photo that was current
              when you applied.
            </p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="space-y-3">
                <Avatar photoId={p.photo?.id} name={bundle.name} size="xl" />
                {p.photo && (
                  <ConfirmAction
                    action={removePhotoAction}
                    trigger={
                      <>
                        <Trash2 aria-hidden className="size-4" /> Remove photo
                      </>
                    }
                    triggerVariant="ghost"
                    title="Remove your photo?"
                    body="Your profile will be incomplete until you upload a new photo, and you won't be able to apply for jobs."
                    confirmLabel="Remove photo"
                    variant="danger"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <PhotoUploadForm hasPhoto={Boolean(p.photo)} maxMb={env().MAX_UPLOAD_MB} />
              </div>
            </div>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="cv-heading">
            <h2 id="cv-heading" className="text-lg font-semibold">
              CV / résumé
            </h2>
            <p className="mt-1 mb-5 text-sm text-ink-600">
              Applications include the CV that was current when you applied. Replacing your CV won&apos;t change past applications.
            </p>
            {p.currentCv && (
              <div className="mb-5 space-y-3">
                <CurrentCv cv={p.currentCv} />
                <ConfirmAction
                  action={removeCvAction}
                  trigger={
                    <>
                      <Trash2 aria-hidden className="size-4" /> Remove CV
                    </>
                  }
                  triggerVariant="ghost"
                  title="Remove your CV?"
                  body="Your profile will be incomplete until you upload a new CV, and you won't be able to apply for jobs."
                  confirmLabel="Remove CV"
                  variant="danger"
                />
              </div>
            )}
            <CvUploadForm hasCv={Boolean(p.currentCv)} maxMb={env().MAX_UPLOAD_MB} />
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="details-heading">
            <h2 id="details-heading" className="mb-5 text-lg font-semibold">
              Profile details
            </h2>
            <ActionForm action={saveFullProfileAction} aria-label="Profile details">
              <CoreProfileFields bundle={bundle} />
              <h3 className="mt-8 mb-4 border-t border-ink-100 pt-6 text-base font-semibold">Education &amp; links</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="institution" label="Institution" optionalLabel defaultValue={p.institution} maxLength={160} />
                <TextField name="courseOfStudy" label="Course of study" optionalLabel defaultValue={p.courseOfStudy} maxLength={160} />
                <TextField
                  name="graduationYear"
                  label="Graduation year"
                  optionalLabel
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={new Date().getFullYear() + 6}
                  defaultValue={p.graduationYear}
                />
                <TextField name="linkedinUrl" label="LinkedIn profile" optionalLabel type="url" defaultValue={p.linkedinUrl} placeholder="linkedin.com/in/your-name" />
                <TextField
                  name="portfolioUrl"
                  label="Portfolio or website"
                  optionalLabel
                  type="url"
                  defaultValue={p.portfolioUrl}
                  className="sm:col-span-2"
                />
                <TextAreaField
                  name="certifications"
                  label="Certifications"
                  optionalLabel
                  rows={3}
                  defaultValue={p.certifications}
                  maxLength={1000}
                  className="sm:col-span-2"
                  hint="e.g. ICAN (Part 1), Google Data Analytics Certificate"
                />
                <TextAreaField
                  name="about"
                  label="Additional information"
                  optionalLabel
                  rows={4}
                  defaultValue={p.about}
                  maxLength={2000}
                  className="sm:col-span-2"
                  hint="Anything else you'd like recruiters to know."
                />
              </div>
              <SubmitButton className="mt-6">Save profile</SubmitButton>
            </ActionForm>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="edu-heading">
            <h2 id="edu-heading" className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap aria-hidden className="size-5 text-brand-700" /> Education history
            </h2>
            {p.education.length > 0 ? (
              <ul className="mt-4 divide-y divide-ink-100">
                {p.education.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">{e.institution}</p>
                      <p className="text-sm text-ink-600">
                        {QUALIFICATION_LABEL[e.qualification]}
                        {e.courseOfStudy ? ` · ${e.courseOfStudy}` : ""}
                        {e.startYear || e.endYear ? ` · ${e.startYear ?? "?"}–${e.endYear ?? "present"}` : ""}
                      </p>
                    </div>
                    <RemoveButton action={removeEducationAction} id={e.id} label={`Remove ${e.institution}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-600">Add the schools and institutions you&apos;ve attended (optional).</p>
            )}
            <details className="mt-4 rounded-md border border-ink-200">
              <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-brand-700">+ Add education</summary>
              <ActionForm action={addEducationAction} className="border-t border-ink-200 p-4" refreshOnSuccess resetOnSuccess>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="institution" label="Institution" required maxLength={160} />
                  <SelectField name="qualification" label="Qualification" required options={qualificationOptions} />
                  <TextField name="courseOfStudy" label="Course of study" optionalLabel maxLength={160} className="sm:col-span-2" />
                  <TextField name="startYear" label="Start year" optionalLabel type="number" inputMode="numeric" />
                  <TextField name="endYear" label="End year" optionalLabel type="number" inputMode="numeric" />
                </div>
                <SubmitButton className="mt-4" variant="secondary">
                  Add education
                </SubmitButton>
              </ActionForm>
            </details>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="exp-heading">
            <h2 id="exp-heading" className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase aria-hidden className="size-5 text-brand-700" /> Employment history
            </h2>
            {p.experience.length > 0 ? (
              <ul className="mt-4 divide-y divide-ink-100">
                {p.experience.map((x) => (
                  <li key={x.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">
                        {x.title} · {x.employer}
                      </p>
                      <p className="text-sm text-ink-600">
                        {x.startDate ? monthYear.format(x.startDate) : "—"} – {x.isCurrent ? "Present" : x.endDate ? monthYear.format(x.endDate) : "—"}
                      </p>
                      {x.description && <p className="mt-1 text-sm whitespace-pre-line text-ink-700">{x.description}</p>}
                    </div>
                    <RemoveButton action={removeExperienceAction} id={x.id} label={`Remove ${x.title}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-600">Add previous roles, internships or NYSC placements (optional).</p>
            )}
            <details className="mt-4 rounded-md border border-ink-200">
              <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-brand-700">+ Add a role</summary>
              <ActionForm action={addExperienceAction} className="border-t border-ink-200 p-4" refreshOnSuccess resetOnSuccess>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="title" label="Job title" required maxLength={120} />
                  <TextField name="employer" label="Employer" required maxLength={160} />
                  <TextField name="startDate" label="Start" optionalLabel type="month" />
                  <TextField name="endDate" label="End" optionalLabel type="month" />
                  <CheckboxField name="isCurrent" label="I currently work here" className="sm:col-span-2" />
                  <TextAreaField name="description" label="Description" optionalLabel rows={3} maxLength={1500} className="sm:col-span-2" />
                </div>
                <SubmitButton className="mt-4" variant="secondary">
                  Add role
                </SubmitButton>
              </ActionForm>
            </details>
          </section>
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <CompletenessCard result={result} />
        </aside>
      </div>
    </>
  );
}

function RemoveButton({ action, id, label }: { action: typeof removeEducationAction; id: string; label: string }) {
  return (
    <ConfirmAction
      action={action}
      hidden={{ id }}
      trigger={
        <>
          <Trash2 aria-hidden className="size-4" />
          <span className="sr-only">{label}</span>
        </>
      }
      triggerVariant="ghost"
      title="Remove this entry?"
      body="This removes it from your profile."
      confirmLabel="Remove"
      variant="danger"
    />
  );
}
