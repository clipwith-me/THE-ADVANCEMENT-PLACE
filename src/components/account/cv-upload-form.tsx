"use client";

import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { FileField } from "@/components/forms/fields";
import { uploadCvAction } from "@/app/(site)/account/actions";

export function CvUploadForm({ next, hasCv, maxMb }: { next?: string; hasCv: boolean; maxMb: number }) {
  return (
    <ActionForm action={uploadCvAction} refreshOnSuccess aria-label="Upload CV">
      {next && <input type="hidden" name="next" value={next} />}
      <FileField
        name="cv"
        label={hasCv ? "Replace your CV" : "Upload your CV"}
        required={!hasCv}
        hint={`PDF or Word (.docx), up to ${maxMb} MB. Your CV is private — only you and our recruitment team can access it.`}
      />
      <SubmitButton className="mt-4" pendingLabel="Uploading…" variant={hasCv ? "secondary" : "primary"}>
        {hasCv ? "Upload new CV" : "Upload CV"}
      </SubmitButton>
    </ActionForm>
  );
}
