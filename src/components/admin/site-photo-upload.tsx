"use client";

import { uploadSitePhotoAction } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { FileField, TextField } from "@/components/forms/fields";

export function SitePhotoUpload() {
  return (
    <ActionForm action={uploadSitePhotoAction} refreshOnSuccess aria-label="Add a photo">
      <div className="grid gap-5 sm:grid-cols-2">
      <FileField
        name="photo"
        label="Photo"
        required
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        hint="JPEG or PNG, up to 15 MB. Large photos are resized for the web automatically, and location data is removed."
      />
      <TextField
        name="caption"
        label="Caption"
        required
        maxLength={160}
        hint="Describe the photo, e.g. “Our reception at Oke-Ilewo”. Also read aloud to visitors using screen readers."
      />
      </div>
      <SubmitButton className="mt-5" pendingLabel="Uploading…">
        Add photo
      </SubmitButton>
    </ActionForm>
  );
}
