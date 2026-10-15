import { CheckCircle2, Circle, Download, FileText } from "lucide-react";
import { SelectField, TextField } from "@/components/forms/fields";
import { ProgressBar } from "@/components/ui/misc";
import { formatBytes, formatDate } from "@/lib/domain/format";
import { NYSC_STATUSES, NYSC_STATUS_LABEL, QUALIFICATIONS, QUALIFICATION_LABEL } from "@/lib/domain/labels";
import { NIGERIAN_STATES } from "@/lib/domain/nigeria";
import { REQUIREMENT_LABEL, type CompletenessResult, type RequirementKey } from "@/lib/domain/profile-completeness";
import type { ProfileBundle } from "@/server/services/profile-service";

export const qualificationOptions = QUALIFICATIONS.map((q) => ({ value: q, label: QUALIFICATION_LABEL[q] }));
export const nyscOptions = NYSC_STATUSES.map((s) => ({ value: s, label: NYSC_STATUS_LABEL[s] }));
export const candidateLocationOptions = [...NIGERIAN_STATES, "Outside Nigeria"];

/** Required fields (+ optional NYSC) shared by the setup and full profile forms. */
export function CoreProfileFields({ bundle }: { bundle: ProfileBundle }) {
  const p = bundle.profile;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField name="name" label="Full name" required defaultValue={bundle.name} autoComplete="name" maxLength={120} />
      <TextField
        name="phone"
        label="Phone number"
        type="tel"
        required
        defaultValue={p?.phone}
        autoComplete="tel"
        inputMode="tel"
        hint="e.g. 0803 123 4567 or +234 803 123 4567"
      />
      <SelectField name="state" label="State of residence" required defaultValue={p?.state} options={candidateLocationOptions} />
      <TextField name="city" label="City or town" optionalLabel defaultValue={p?.city} autoComplete="address-level2" maxLength={80} />
      <TextField
        name="headline"
        label="Professional headline or career interest"
        required
        defaultValue={p?.headline}
        maxLength={140}
        className="sm:col-span-2"
        hint="e.g. “Accounting graduate seeking an entry-level finance role”"
      />
      <SelectField
        name="highestQualification"
        label="Highest qualification"
        required
        defaultValue={p?.highestQualification}
        options={qualificationOptions}
      />
      <TextField
        name="qualificationDetail"
        label="Qualification details"
        optionalLabel
        defaultValue={p?.qualificationDetail}
        maxLength={140}
        hint="e.g. “HND Computer Science” or “B.Sc. Economics, Second Class Upper”"
      />
      <TextField
        name="skills"
        label="Skills"
        required
        defaultValue={p?.skills.map((s) => s.skill.name).join(", ")}
        className="sm:col-span-2"
        hint="Separate skills with commas, e.g. Microsoft Excel, Customer service, Bookkeeping"
      />
      <SelectField
        name="nyscStatus"
        label="NYSC status"
        optionalLabel
        defaultValue={p?.nyscStatus}
        options={nyscOptions}
        placeholder="Prefer not to say"
        hint="Optional — it never affects your ability to register or apply."
      />
    </div>
  );
}

export function CompletenessCard({ result, title = "Profile completion" }: { result: CompletenessResult; title?: string }) {
  const keys = Object.keys(REQUIREMENT_LABEL) as RequirementKey[];
  const checked = keys.filter((k) => k !== "cv" || result.total === 8);
  return (
    <div className="card p-5">
      <ProgressBar percent={result.percent} label={title} />
      <ul className="mt-4 space-y-2 text-sm">
        {checked.map((k) => {
          const done = !result.missing.includes(k);
          return (
            <li key={k} className={`flex items-center gap-2 ${done ? "text-ink-600" : "font-medium text-ink-900"}`}>
              {done ? (
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success-700" />
              ) : (
                <Circle aria-hidden className="size-4 shrink-0 text-ink-400" />
              )}
              <span>
                {REQUIREMENT_LABEL[k]}
                <span className="sr-only">{done ? " — done" : " — still needed"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CurrentCv({ cv }: { cv: NonNullable<NonNullable<ProfileBundle["profile"]>["currentCv"]> }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-ink-200 bg-ink-50 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-brand-700 ring-1 ring-ink-200">
        <FileText aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{cv.originalName}</p>
        <p className="text-xs text-ink-600">
          {formatBytes(cv.sizeBytes)} · uploaded {formatDate(cv.createdAt)}
        </p>
      </div>
      <a
        href={`/api/files/${cv.id}`}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-brand-700 hover:bg-white"
      >
        <Download aria-hidden className="size-4" /> <span className="hidden xs:inline">Download</span>
        <span className="sr-only"> {cv.originalName}</span>
      </a>
    </div>
  );
}
