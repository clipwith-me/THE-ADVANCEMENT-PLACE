"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/domain/redirect";
import { formToObject } from "@/lib/validation/common";
import { success, toFormState, type FormState } from "@/server/action-state";
import { requireCandidate } from "@/server/auth/current";
import { withdrawApplication } from "@/server/services/application-service";
import { readUpload } from "@/server/services/file-service";
import {
  addEducation,
  addExperience,
  removeCurrentCv,
  removeEducation,
  removeExperience,
  saveProfile,
  uploadCv,
} from "@/server/services/profile-service";

/** After a setup step, continue to the intended destination once the profile is complete. */
function continueIfComplete(complete: boolean, next: string | undefined) {
  if (complete && next) redirect(safeNextPath(next, "/jobs"));
}

export async function saveCoreProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  const values = formToObject(form);
  let complete = false;
  try {
    complete = (await saveProfile(user.id, values, "core")).complete;
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/account", "layout");
  continueIfComplete(complete, values.next);
  return success(complete ? "Profile saved — you're all set." : "Details saved. Upload your CV to finish your profile.");
}

export async function saveFullProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  const values = formToObject(form);
  try {
    await saveProfile(user.id, values, "full");
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/account", "layout");
  return success("Your profile has been updated.");
}

export async function uploadCvAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  const next = typeof form.get("next") === "string" ? (form.get("next") as string) : undefined;
  let complete = false;
  try {
    const file = await readUpload(form.get("cv"));
    if (!file) return { status: "error", message: "Choose a file to upload.", fieldErrors: { cv: ["Choose a PDF or DOCX file"] }, at: Date.now() };
    complete = (await uploadCv(user.id, file)).complete;
  } catch (e) {
    return toFormState(e, {}, "cv");
  }
  revalidatePath("/account", "layout");
  continueIfComplete(complete, next);
  return success("CV uploaded.");
}

export async function removeCvAction(_prev: FormState): Promise<FormState> {
  const user = await requireCandidate();
  try {
    await removeCurrentCv(user.id);
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/account", "layout");
  return success("CV removed.");
}

export async function addEducationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  const values = formToObject(form);
  try {
    await addEducation(user.id, values);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/account/profile");
  return success("Education added.");
}

export async function removeEducationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  try {
    await removeEducation(user.id, String(form.get("id") ?? ""));
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/account/profile");
  return success("Removed.");
}

export async function addExperienceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  const values = formToObject(form);
  try {
    await addExperience(user.id, values);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/account/profile");
  return success("Role added.");
}

export async function removeExperienceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  try {
    await removeExperience(user.id, String(form.get("id") ?? ""));
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/account/profile");
  return success("Removed.");
}

export async function withdrawApplicationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireCandidate();
  try {
    await withdrawApplication(user, String(form.get("id") ?? ""));
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/account/applications");
  return success("Application withdrawn.");
}
