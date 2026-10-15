"use server";

import { redirect } from "next/navigation";
import { formToObject } from "@/lib/validation/common";
import { toFormState, type FormState } from "@/server/action-state";
import { requireCandidate } from "@/server/auth/current";
import { applyToJob, ProfileIncompleteError } from "@/server/services/application-service";

export async function applyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  const values = formToObject(form);
  const jobId = values.jobId ?? "";
  const slug = values.slug ?? "";
  let target: string;
  try {
    const result = await applyToJob(user, jobId, { coverMessage: values.coverMessage ?? "" });
    target = `/account/applications/${result.applicationId}?submitted=1&emailed=${result.confirmationEmail.delivered ? 1 : 0}`;
  } catch (e) {
    if (e instanceof ProfileIncompleteError) {
      redirect(`/account/setup?next=${encodeURIComponent(`/jobs/${slug}`)}`);
    }
    return toFormState(e, values);
  }
  redirect(target);
}
