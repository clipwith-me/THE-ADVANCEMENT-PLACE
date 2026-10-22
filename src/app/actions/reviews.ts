"use server";

import { formToObject } from "@/lib/validation/common";
import { success, toFormState, type FormState } from "@/server/action-state";
import { clientIp } from "@/server/auth/current";
import { submitReview } from "@/server/services/review-service";

export async function submitReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    await submitReview(values, await clientIp());
  } catch (e) {
    return toFormState(e, values);
  }
  return success("Thank you for your review! It will appear on the website once our team has checked it.", {});
}
