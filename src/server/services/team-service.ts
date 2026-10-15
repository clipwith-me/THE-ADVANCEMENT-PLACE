import { z } from "zod";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import { conflict, forbidden, notFound, validationError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { emailField, requiredText } from "@/lib/validation/common";
import { parseOrThrow } from "@/lib/validation/parse";
import { audit } from "../audit";
import { isAdmin, type Actor } from "../auth/policies";
import { invalidateUserSessions } from "../auth/session";
import { sendEmail } from "../email/mailer";
import { adminInviteEmail } from "../email/templates";
import { createPasswordSetupLink } from "./auth-service";

/**
 * Staff (administrator) management from the dashboard, so the business can
 * add and remove its own staff without a developer. The CLI remains for the
 * very first administrator. Access is removed by suspending (reversible,
 * keeps the audit trail), never by deleting.
 */
function assertAdmin(actor: Actor) {
  if (!isAdmin(actor)) throw forbidden();
}

export async function listAdmins(actor: Actor) {
  assertAdmin(actor);
  return db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, status: true, lastLoginAt: true, createdAt: true },
  });
}

const inviteSchema = z.object({ name: requiredText("Full name", 2, 120), email: emailField });

export interface InviteResult {
  emailed: boolean;
  promoted: boolean;
}

export async function inviteAdmin(actor: Actor & { name?: string }, raw: Record<string, string>): Promise<InviteResult> {
  assertAdmin(actor);
  const input = parseOrThrow(inviteSchema, raw);
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing?.role === "ADMIN") throw conflict("That person is already an administrator.");

  let userId: string;
  let promoted = false;
  if (existing) {
    // An existing candidate account is promoted; their sessions end so the new role applies at once.
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", status: "ACTIVE" } });
    await invalidateUserSessions(existing.id);
    userId = existing.id;
    promoted = true;
  } else {
    // Unusable random password until they choose their own via the emailed link.
    const user = await db.user.create({
      data: { email: input.email, name: input.name, role: "ADMIN", passwordHash: await hashPassword(randomToken(32)), emailVerifiedAt: new Date() },
    });
    userId = user.id;
  }
  await audit({ actorId: actor.id, action: promoted ? "admin.promote" : "admin.invite", entityType: "User", entityId: userId });

  const link = await createPasswordSetupLink(userId);
  const sent = await sendEmail(adminInviteEmail(input.email, existing?.name ?? input.name, actor.name ?? "An administrator", link));
  return { emailed: sent.delivered, promoted };
}

async function assertNotLastActiveAdmin(targetId: string) {
  const others = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE", NOT: { id: targetId } } });
  if (others === 0) throw validationError("You can't remove the last active administrator.");
}

export async function setAdminStatus(actor: Actor, targetId: string, status: "ACTIVE" | "SUSPENDED") {
  assertAdmin(actor);
  if (targetId === actor.id) throw validationError("You can't change your own access. Ask another administrator.");
  const target = await db.user.findUnique({ where: { id: targetId }, select: { role: true } });
  if (!target || target.role !== "ADMIN") throw notFound();
  if (status === "SUSPENDED") await assertNotLastActiveAdmin(targetId);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetId }, data: { status } });
    await audit({ actorId: actor.id, action: status === "SUSPENDED" ? "admin.remove_access" : "admin.restore_access", entityType: "User", entityId: targetId }, tx);
  });
  if (status === "SUSPENDED") await invalidateUserSessions(targetId);
}
