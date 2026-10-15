"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/domain/redirect";
import { formToObject } from "@/lib/validation/common";
import { success, toFormState, type FormState } from "@/server/action-state";
import {
  clearSessionCookie,
  clientIp,
  currentSessionToken,
  getCurrentUser,
  requireUser,
  setSessionCookie,
} from "@/server/auth/current";
import { invalidateSession } from "@/server/auth/session";
import {
  changePassword,
  deleteOwnAccount,
  login,
  registerCandidate,
  requestPasswordReset,
  resetPassword,
  sendVerification,
} from "@/server/services/auth-service";

/*
 * Thin adapters: read the form, call the service, translate the outcome.
 * CSRF: Next.js Server Actions only accept POSTs whose Origin matches the
 * host, and the session cookie is SameSite=Lax.
 */

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    const { session } = await registerCandidate(values, { ip: await clientIp() });
    await setSessionCookie(session.token, session.expiresAt);
  } catch (e) {
    return toFormState(e, values);
  }
  const next = safeNextPath(values.next, "/account/setup");
  redirect(next.startsWith("/account/setup") ? next : `/account/setup?next=${encodeURIComponent(next)}`);
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  let role: string;
  try {
    const { user, session } = await login(values, { ip: await clientIp() }, "CANDIDATE");
    await setSessionCookie(session.token, session.expiresAt);
    role = user.role;
  } catch (e) {
    return toFormState(e, values);
  }
  redirect(role === "ADMIN" ? "/admin" : safeNextPath(values.next, "/account"));
}

export async function adminLoginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    const { session } = await login(values, { ip: await clientIp() }, "ADMIN");
    await setSessionCookie(session.token, session.expiresAt);
  } catch (e) {
    return toFormState(e, values);
  }
  const next = safeNextPath(values.next, "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  const token = await currentSessionToken();
  if (token) await invalidateSession(token);
  await clearSessionCookie();
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    await requestPasswordReset(values, { ip: await clientIp() });
  } catch (e) {
    return toFormState(e, values);
  }
  // Identical response whether or not the account exists.
  return success("If an account exists for that email, we've sent a link to reset your password. It expires in 30 minutes.", {
    email: values.email ?? "",
  });
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    await resetPassword(values);
  } catch (e) {
    return toFormState(e, values);
  }
  redirect("/login?reset=1");
}

export async function resendVerificationAction(_prev: FormState): Promise<FormState> {
  try {
    const user = await requireUser();
    const result = await sendVerification(user.id);
    if (!result.delivered) {
      return { status: "error", message: "We couldn't send the email right now. Please try again later.", at: Date.now() };
    }
  } catch (e) {
    return toFormState(e);
  }
  return success("Verification email sent. Please check your inbox (and spam folder).");
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    const user = await requireUser();
    await changePassword(user.id, values, (await currentSessionToken()) ?? "");
  } catch (e) {
    return toFormState(e, values);
  }
  return success("Password updated. Other devices have been signed out.");
}

export async function deleteAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  try {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    await deleteOwnAccount(user.id, values.password ?? "");
  } catch (e) {
    return toFormState(e, values);
  }
  await clearSessionCookie();
  redirect("/?account-deleted=1");
}
