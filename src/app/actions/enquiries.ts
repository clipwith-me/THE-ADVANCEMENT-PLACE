"use server";

import { formToObject } from "@/lib/validation/common";
import { success, toFormState, type FormState } from "@/server/action-state";
import { clientIp } from "@/server/auth/current";
import { readUpload } from "@/server/services/file-service";
import { submitCareerAssistance, submitContact, submitOutsourcing } from "@/server/services/enquiry-service";

// The enquiry is always stored before any email is attempted, so "received"
// is accurate even when the notification email can't be sent.
const RECEIVED = "Thank you — your enquiry has been received. Our team will respond during business hours (Monday–Friday, 8 AM–5 PM).";

export async function contactAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    await submitContact(values, await clientIp());
  } catch (e) {
    return toFormState(e, values);
  }
  return success(RECEIVED, {});
}

export async function careerAssistanceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    const attachment = await readUpload(form.get("attachment"));
    await submitCareerAssistance(values, attachment, await clientIp());
  } catch (e) {
    return toFormState(e, values, "attachment");
  }
  return success(RECEIVED, {});
}

export async function outsourcingAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    const attachment = await readUpload(form.get("attachment"));
    await submitOutsourcing(values, attachment, await clientIp());
  } catch (e) {
    return toFormState(e, values, "attachment");
  }
  return success(RECEIVED, {});
}
