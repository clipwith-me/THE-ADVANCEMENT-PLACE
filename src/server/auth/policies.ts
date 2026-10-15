import type { Role } from "@/generated/prisma/enums";

/**
 * Centralised authorisation rules. Services call these instead of scattering
 * role comparisons, so a permission change happens in exactly one place.
 * Every function is deny-by-default.
 */
export interface Actor {
  id: string;
  role: Role;
}

export const isAdmin = (actor: Actor | null | undefined): boolean => actor?.role === "ADMIN";
export const isCandidate = (actor: Actor | null | undefined): boolean => actor?.role === "CANDIDATE";

export const canManageJobs = isAdmin;
export const canReviewApplications = isAdmin;
export const canViewCandidates = isAdmin;
export const canManageEnquiries = isAdmin;
export const canManageSettings = isAdmin;

export const canApplyForJobs = isCandidate;

/** A candidate may see only their own application; admins may see all. */
export function canViewApplication(actor: Actor | null | undefined, application: { candidateId: string }): boolean {
  if (!actor) return false;
  return isAdmin(actor) || application.candidateId === actor.id;
}

/**
 * Private document access: the owning candidate, or an administrator.
 * Anonymous enquiry attachments (no owner) are admin-only.
 */
export function canDownloadFile(actor: Actor | null | undefined, file: { ownerId: string | null }): boolean {
  if (!actor) return false;
  if (isAdmin(actor)) return true;
  return file.ownerId !== null && file.ownerId === actor.id;
}
