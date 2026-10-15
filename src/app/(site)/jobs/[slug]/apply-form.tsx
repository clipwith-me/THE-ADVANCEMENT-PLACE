"use client";

import { FileText } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextAreaField } from "@/components/forms/fields";
import { applyAction } from "./actions";

export function ApplyForm({ jobId, slug, cvName }: { jobId: string; slug: string; cvName: string | null }) {
  return (
    <ActionForm action={applyAction} aria-label="Apply for this job">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="slug" value={slug} />
      {cvName && (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-ink-50 px-3 py-2 text-sm text-ink-700">
          <FileText aria-hidden className="size-4 shrink-0 text-brand-700" />
          <span className="min-w-0 truncate">
            Your CV: <span className="font-medium text-ink-900">{cvName}</span>
          </span>
        </p>
      )}
      <TextAreaField
        name="coverMessage"
        label="Message to the recruiter"
        optionalLabel
        rows={4}
        maxLength={3000}
        placeholder="Briefly say why you're a good fit for this role."
      />
      <SubmitButton size="lg" className="mt-4 w-full" pendingLabel="Submitting application…">
        Submit application
      </SubmitButton>
      <p className="mt-3 text-xs text-ink-600">
        Your profile details and CV will be shared with our recruitment team for this vacancy.
      </p>
    </ActionForm>
  );
}
