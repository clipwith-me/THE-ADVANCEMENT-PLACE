import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isProduction } from "@/lib/env";
import type { CompletenessResult } from "@/lib/domain/profile-completeness";
import { validateSessionToken, type SessionUser } from "./session";
import { getCompleteness, type ProfileBundle } from "../services/profile-service";

/**
 * Next.js glue for sessions: cookie handling and per-request guards. Every
 * protected page AND every server action calls one of the require* helpers —
 * the proxy's cookie check is only a fast redirect, never the security boundary.
 */
// __Host- prefix (production): the browser enforces Secure, Path=/ and no Domain.
export const sessionCookieName = () => (isProduction() ? "__Host-tap_session" : "tap_session");

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(sessionCookieName(), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(sessionCookieName());
}

export async function currentSessionToken(): Promise<string | null> {
  return (await cookies()).get(sessionCookieName())?.value ?? null;
}

/** Memoised per request so layouts, pages and actions share one DB lookup. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await currentSessionToken();
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result?.user ?? null;
});

async function currentPath(): Promise<string> {
  return (await headers()).get("x-pathname") ?? "/";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(await currentPath())}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(await currentPath())}`);
  if (user.role !== "ADMIN") redirect("/access-denied");
  return user;
}

export async function requireCandidate(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "CANDIDATE") redirect("/admin");
  return user;
}

/**
 * The job-board gate: a signed-in candidate whose profile passes the
 * server-side completeness rules. Otherwise redirects to setup, preserving
 * the intended destination.
 */
export async function requireCompleteCandidate(): Promise<{ user: SessionUser; bundle: ProfileBundle; completeness: CompletenessResult }> {
  const user = await requireCandidate();
  const { bundle, result } = await getCompleteness(user.id);
  if (!result.complete) redirect(`/account/setup?next=${encodeURIComponent(await currentPath())}`);
  return { user, bundle, completeness: result };
}

/** Best-effort client IP for rate limiting (hashed before storage). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  // On Vercel/most proxies the left-most X-Forwarded-For entry is the client.
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "unknown";
}
