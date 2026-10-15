"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/lib/validation/common";
import { success, toFormState, type FormState } from "@/server/action-state";
import { requireAdmin } from "@/server/auth/current";
import { setCandidateStatus } from "@/server/services/admin-service";
import { addApplicationNote, updateApplicationStatus } from "@/server/services/application-service";
import { updateEnquiry } from "@/server/services/enquiry-service";
import { createJob, transitionJob, updateJob, type JobTransition } from "@/server/services/job-service";
import { updateSettings } from "@/server/services/settings-service";

// Every action re-authenticates and services re-check the policy; the admin
// layout's guard alone is never relied on.

export async function createJobAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  const intent = values.intent === "publish" ? "publish" : "draft";
  let id: string;
  try {
    id = (await createJob(admin, values, intent)).id;
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${id}/edit?saved=${intent}`);
}

export async function updateJobAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  const intent = values.intent === "publish" ? "publish" : values.intent === "draft" ? "draft" : "save";
  try {
    await updateJob(admin, values.id ?? "", values, intent);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  return success(intent === "publish" ? "Saved and published." : intent === "draft" ? "Saved as draft." : "Changes saved.", values);
}

const TRANSITIONS: JobTransition[] = ["publish", "unpublish", "close", "archive", "reopen"];

export async function jobTransitionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const action = String(form.get("transition") ?? "") as JobTransition;
  try {
    if (!TRANSITIONS.includes(action)) throw new Error("Unknown transition");
    await transitionJob(admin, String(form.get("id") ?? ""), action);
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  return success("Job updated.");
}

export async function applicationStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  let emailed: boolean | null;
  try {
    emailed = (await updateApplicationStatus(admin, values.id ?? "", values, values.notify === "on")).emailed;
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath(`/admin/applications/${values.id}`);
  return success(
    emailed === null ? "Status updated." : emailed ? "Status updated and the candidate was emailed." : "Status updated, but the email notification could not be sent.",
  );
}

export async function applicationNoteAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  try {
    await addApplicationNote(admin, values.id ?? "", values);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath(`/admin/applications/${values.id}`);
  return success("Note added.", { body: "" });
}

export async function enquiryUpdateAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  try {
    await updateEnquiry(admin, values.id ?? "", values);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/admin/enquiries", "layout");
  return success("Enquiry updated.", values);
}

export async function candidateStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const status = form.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  try {
    await setCandidateStatus(admin, String(form.get("id") ?? ""), status);
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/admin/candidates", "layout");
  return success(status === "SUSPENDED" ? "Account suspended." : "Account reactivated.");
}

export async function settingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  try {
    await updateSettings(admin, values);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/", "layout");
  return success("Settings saved.", values);
}
