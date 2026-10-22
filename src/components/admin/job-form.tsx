import type { ReactNode } from "react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, FileField, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import type { FormState } from "@/server/action-state";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABEL, WORK_ARRANGEMENTS, WORK_ARRANGEMENT_LABEL } from "@/lib/domain/labels";
import { JOB_LOCATIONS } from "@/lib/domain/nigeria";

export interface JobFormValues {
  id?: string;
  title?: string;
  categoryId?: string;
  employerName?: string | null;
  showEmployer?: boolean;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  qualifications?: string[];
  skills?: string[];
  employmentType?: string;
  workArrangement?: string;
  state?: string;
  city?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: string | null;
  experienceYearsMin?: number | null;
  experienceYearsMax?: number | null;
  deadline?: Date | null;
  applyInstructions?: string | null;
  featured?: boolean;
  status?: string;
  flyer?: { id: string; mimeType: string; originalName: string } | null;
}

/** Date in Lagos as YYYY-MM-DD for the date input. */
const lagosDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d);

function Fieldset({ legend, description, children }: { legend: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="card p-5 sm:p-6">
      <legend className="sr-only">{legend}</legend>
      <h2 className="text-base font-semibold" aria-hidden>
        {legend}
      </h2>
      {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function JobForm({
  action,
  job,
  categories,
  mode,
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  job?: JobFormValues;
  categories: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const v = job ?? {};
  const isPublished = v.status === "PUBLISHED";
  return (
    <ActionForm action={action} className="space-y-6" aria-label={mode === "create" ? "Create job" : "Edit job"} refreshOnSuccess={mode === "edit"}>
      {v.id && <input type="hidden" name="id" value={v.id} />}

      <Fieldset legend="Basics">
        <TextField name="title" label="Job title" required defaultValue={v.title} maxLength={120} className="sm:col-span-2" />
        <SelectField name="categoryId" label="Category" required defaultValue={v.categoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <SelectField
          name="employmentType"
          label="Employment type"
          required
          defaultValue={v.employmentType}
          options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABEL[t] }))}
        />
        <SelectField
          name="workArrangement"
          label="Work arrangement"
          required
          defaultValue={v.workArrangement}
          options={WORK_ARRANGEMENTS.map((t) => ({ value: t, label: WORK_ARRANGEMENT_LABEL[t] }))}
        />
        <SelectField name="state" label="Location (state)" required defaultValue={v.state} options={JOB_LOCATIONS} />
        <TextField name="city" label="City / area" optionalLabel defaultValue={v.city} maxLength={80} />
        <TextField
          name="employerName"
          label="Employer / hiring organisation"
          optionalLabel
          defaultValue={v.employerName}
          maxLength={120}
          hint="Stored internally. It's shown publicly only if you tick the box below."
        />
        <CheckboxField
          name="showEmployer"
          defaultChecked={v.showEmployer}
          label="Show the employer's name on the public listing"
          hint="Only tick this if the employer has authorised publication."
          className="sm:col-span-2"
        />
      </Fieldset>

      <Fieldset legend="Description" description="Write in plain text. Put each list item on its own line.">
        <TextAreaField name="summary" label="Short summary" required rows={2} maxLength={300} defaultValue={v.summary} className="sm:col-span-2" hint="Shown on job cards and search results (20–300 characters)." />
        <TextAreaField name="description" label="Full description" required rows={8} maxLength={10000} defaultValue={v.description} className="sm:col-span-2" hint="Separate paragraphs with a blank line." />
        <TextAreaField name="responsibilities" label="Responsibilities" required rows={5} defaultValue={v.responsibilities?.join("\n")} className="sm:col-span-2" hint="One per line." />
        <TextAreaField name="requirements" label="Requirements" required rows={5} defaultValue={v.requirements?.join("\n")} className="sm:col-span-2" hint="One per line." />
        <TextAreaField name="qualifications" label="Qualifications" optionalLabel rows={3} defaultValue={v.qualifications?.join("\n")} className="sm:col-span-2" hint="One per line, e.g. “OND, HND or B.Sc. in Accounting”." />
        <TextField name="skills" label="Relevant skills" optionalLabel defaultValue={v.skills?.join(", ")} className="sm:col-span-2" hint="Comma-separated." />
      </Fieldset>

      <Fieldset legend="Pay, experience & deadline" description="Only enter a salary that the employer has confirmed. Leave it empty to show “Not disclosed”.">
        <TextField name="salaryMin" label="Minimum salary (₦)" optionalLabel inputMode="numeric" defaultValue={v.salaryMin} />
        <TextField name="salaryMax" label="Maximum salary (₦)" optionalLabel inputMode="numeric" defaultValue={v.salaryMax} />
        <SelectField
          name="salaryPeriod"
          label="Salary period"
          optionalLabel
          defaultValue={v.salaryPeriod}
          options={[
            { value: "MONTH", label: "Per month" },
            { value: "YEAR", label: "Per year" },
          ]}
        />
        <div className="hidden sm:block" />
        <TextField name="experienceYearsMin" label="Minimum experience (years)" optionalLabel inputMode="numeric" defaultValue={v.experienceYearsMin} />
        <TextField name="experienceYearsMax" label="Maximum experience (years)" optionalLabel inputMode="numeric" defaultValue={v.experienceYearsMax} />
        <TextField
          name="deadline"
          label="Application deadline"
          optionalLabel
          type="date"
          defaultValue={v.deadline ? lagosDate(v.deadline) : undefined}
          hint="Applications close at the end of this day (Lagos time). Leave empty for “open until filled”."
        />
        <CheckboxField name="featured" defaultChecked={v.featured} label="Feature on the homepage" className="sm:self-end" />
        <TextAreaField name="applyInstructions" label="Additional application instructions" optionalLabel rows={3} maxLength={1000} defaultValue={v.applyInstructions} className="sm:col-span-2" />
      </Fieldset>

      <Fieldset
        legend="Job flyer"
        description="Optional. If there's a flyer for this vacancy, upload it and it will appear on the job page. Images are resized for the web automatically."
      >
        {v.flyer && (
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            {v.flyer.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file
              <img src={`/media/${v.flyer.id}`} alt="Current job flyer" className="h-40 w-auto rounded-md object-contain ring-1 ring-ink-200" />
            ) : (
              <a href={`/media/${v.flyer.id}`} className="link text-sm">
                Current flyer: {v.flyer.originalName}
              </a>
            )}
            <CheckboxField name="removeFlyer" label="Remove this flyer" hint="Or choose a new file below to replace it." />
          </div>
        )}
        <FileField
          name="flyer"
          label={v.flyer ? "Replace flyer" : "Upload flyer"}
          optionalLabel
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          className="sm:col-span-2"
          hint="JPEG, PNG or PDF, up to 15 MB."
        />
      </Fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-lg sm:border">
        {mode === "create" ? (
          <>
            <SubmitButton name="intent" value="draft" variant="secondary" pendingLabel="Saving…">
              Save as draft
            </SubmitButton>
            <SubmitButton name="intent" value="publish" pendingLabel="Publishing…">
              Publish job
            </SubmitButton>
          </>
        ) : isPublished ? (
          <SubmitButton name="intent" value="save" pendingLabel="Saving…">
            Save changes
          </SubmitButton>
        ) : (
          <>
            <SubmitButton name="intent" value="draft" variant="secondary" pendingLabel="Saving…">
              Save draft
            </SubmitButton>
            <SubmitButton name="intent" value="publish" pendingLabel="Publishing…">
              Save &amp; publish
            </SubmitButton>
          </>
        )}
      </div>
    </ActionForm>
  );
}
