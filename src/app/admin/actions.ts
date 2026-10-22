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
import { ADMIN_IMAGE_MAX_BYTES, readUpload } from "@/server/services/file-service";
import { moderateReview, type ReviewDecision } from "@/server/services/review-service";
import { updateSettings } from "@/server/services/settings-service";
import { deleteSitePhoto, moveSitePhoto, setSitePhotoPublished, updateSitePhoto, uploadSitePhoto } from "@/server/services/site-content-service";
import { inviteAdmin, setAdminStatus } from "@/server/services/team-service";

// Every action re-authenticates and services re-check the policy; the admin
// layout's guard alone is never relied on.

export async function createJobAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  const intent = values.intent === "publish" ? "publish" : "draft";
  let id: string;
  try {
    const upload = await readUpload(form.get("flyer"), ADMIN_IMAGE_MAX_BYTES);
    id = (await createJob(admin, values, intent, { upload })).id;
  } catch (e) {
    return toFormState(e, values, "flyer");
  }
  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${id}/edit?saved=${intent}`);
}

export async function updateJobAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  const intent = values.intent === "publish" ? "publish" : values.intent === "draft" ? "draft" : "save";
  try {
    const upload = await readUpload(form.get("flyer"), ADMIN_IMAGE_MAX_BYTES);
    await updateJob(admin, values.id ?? "", values, intent, { upload, remove: values.removeFlyer === "on" });
  } catch (e) {
    return toFormState(e, values, "flyer");
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

export async function inviteAdminAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  let result: { emailed: boolean; promoted: boolean };
  try {
    result = await inviteAdmin(admin, values);
  } catch (e) {
    return toFormState(e, values);
  }
  revalidatePath("/admin/team");
  const who = values.email ?? "they";
  return success(
    result.emailed
      ? `Invitation sent. ${who} will receive an email to choose their password.`
      : `Access granted, but the invitation email couldn't be sent. Ask ${who} to use “Forgot your password?” on the sign-in page.`,
    { name: "", email: "" },
  );
}

export async function adminAccessAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const status = form.get("status") === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
  try {
    await setAdminStatus(admin, String(form.get("id") ?? ""), status);
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/admin/team");
  return success(status === "ACTIVE" ? "Access restored." : "Access removed.");
}

const REVIEW_DECISIONS: ReviewDecision[] = ["approve", "reject", "delete"];

export async function moderateReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const decision = String(form.get("decision") ?? "") as ReviewDecision;
  try {
    if (!REVIEW_DECISIONS.includes(decision)) throw new Error("Unknown decision");
    await moderateReview(admin, String(form.get("id") ?? ""), decision);
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
  return success(decision === "approve" ? "Review published." : decision === "reject" ? "Review hidden." : "Review deleted.");
}

function revalidateSitePhotos() {
  revalidatePath("/admin/site-photos");
  revalidatePath("/about");
}

export async function uploadSitePhotoAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  try {
    const file = await readUpload(form.get("photo"), ADMIN_IMAGE_MAX_BYTES);
    if (!file) return { status: "error", message: "Choose a photo to upload.", fieldErrors: { photo: ["Choose a JPEG or PNG photo"] }, values, at: Date.now() };
    await uploadSitePhoto(admin, file, values);
  } catch (e) {
    return toFormState(e, values, "photo");
  }
  revalidateSitePhotos();
  return success("Photo added to the About page.", {});
}

export async function updateSitePhotoAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formToObject(form);
  const id = values.id ?? "";
  try {
    if (values.op === "caption") await updateSitePhoto(admin, id, values);
    else if (values.op === "show" || values.op === "hide") await setSitePhotoPublished(admin, id, values.op === "show");
    else if (values.op === "up" || values.op === "down") await moveSitePhoto(admin, id, values.op);
    else if (values.op === "delete") await deleteSitePhoto(admin, id);
    else throw new Error("Unknown operation");
  } catch (e) {
    return toFormState(e, values);
  }
  revalidateSitePhotos();
  return success(values.op === "delete" ? "Photo deleted." : "Saved.");
}
