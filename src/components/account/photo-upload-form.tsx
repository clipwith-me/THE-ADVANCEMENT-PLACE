"use client";

import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { FileField } from "@/components/forms/fields";
import { uploadPhotoAction } from "@/app/(site)/account/actions";

export function PhotoUploadForm({ next, hasPhoto, maxMb }: { next?: string; hasPhoto: boolean; maxMb: number }) {
  return (
    <ActionForm action={uploadPhotoAction} refreshOnSuccess aria-label="Upload passport photograph">
      {next && <input type="hidden" name="next" value={next} />}
      <FileField
        name="photo"
        label={hasPhoto ? "Replace your photo" : "Upload your passport photograph"}
        required={!hasPhoto}
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        hint={`A clear, recent head-and-shoulders photo, JPEG or PNG, up to ${maxMb} MB. It helps our team identify you and is never shown publicly. Location and device details are removed from the file.`}
      />
      <SubmitButton className="mt-4" pendingLabel="Uploading…" variant={hasPhoto ? "secondary" : "primary"}>
        {hasPhoto ? "Upload new photo" : "Upload photo"}
      </SubmitButton>
    </ActionForm>
  );
}
