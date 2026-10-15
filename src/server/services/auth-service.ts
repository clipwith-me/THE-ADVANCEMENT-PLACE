import type { AuthTokenType, Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { conflict, unauthenticated, validationError } from "@/lib/errors";
import { dummyVerify, hashPassword, verifyPassword } from "@/lib/password";
import { parseOrThrow as parse } from "@/lib/validation/parse";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { audit } from "../audit";
import { createSession, invalidateUserSessions } from "../auth/session";
import { sendEmail, type SendResult } from "../email/mailer";
import { passwordResetEmail, verificationEmail } from "../email/templates";
import { enforce, LIMITS } from "../rate-limit";
import { deleteStoredFile } from "./file-service";

const TOKEN_TTL: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 3600_000,
  PASSWORD_RESET: 30 * 60_000,
};

export interface RequestContext {
  ip: string;
}


async function issueToken(userId: string, type: AuthTokenType, ttlMs = TOKEN_TTL[type]): Promise<string> {
  const token = randomToken();
  await db.$transaction([
    // Only the newest link of each type works.
    db.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.authToken.create({
      data: { userId, type, tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + ttlMs) },
    }),
  ]);
  return token;
}

/** Atomically consumes a token: valid only once and only before expiry. */
async function consumeToken(token: string, type: AuthTokenType): Promise<string | null> {
  const tokenHash = sha256Hex(token);
  const now = new Date();
  const result = await db.authToken.updateMany({
    where: { tokenHash, type, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (result.count !== 1) return null;
  const row = await db.authToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  return row?.userId ?? null;
}

// ─── Registration & verification ─────────────────────────────────────────────

export async function registerCandidate(raw: Record<string, string>, ctx: RequestContext) {
  await enforce(LIMITS.register, ctx.ip);
  const input = parse(registerSchema, raw);
  const passwordHash = await hashPassword(input.password);
  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw conflict("An account with this email already exists. Sign in, or reset your password if you've forgotten it.");
  }
  // Role is fixed server-side: public registration can only ever create candidates.
  const user = await db.user.create({
    data: { email: input.email, name: input.name, passwordHash, role: "CANDIDATE", profile: { create: {} } },
  });
  await audit({ actorId: user.id, action: "auth.register", entityType: "User", entityId: user.id });
  const email = await sendVerification(user.id);
  const session = await createSession(user.id, "CANDIDATE");
  return { user, session, verificationEmail: email };
}

export async function sendVerification(userId: string): Promise<SendResult> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerifiedAt) return { delivered: false };
  await enforce(LIMITS.verificationEmail, user.id);
  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  return sendEmail(verificationEmail(user.email, user.name, `${env().APP_URL}/verify-email?token=${encodeURIComponent(token)}`));
}

export async function verifyEmail(token: string): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const userId = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!userId) return false;
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  await audit({ actorId: userId, action: "auth.email_verified", entityType: "User", entityId: userId });
  return true;
}

// ─── Login ───────────────────────────────────────────────────────────────────

const INVALID_LOGIN = "The email or password is incorrect.";

/**
 * Verifies credentials for the given portal. The same generic error is used
 * for unknown emails, wrong passwords, suspended accounts and wrong portal, and
 * unknown emails still pay the hashing cost, so responses don't reveal which
 * emails are registered.
 */
export async function login(raw: Record<string, string>, ctx: RequestContext, portal: Role) {
  const input = parse(loginSchema, raw);
  await enforce(LIMITS.login, ctx.ip);
  await enforce(LIMITS.loginAccount, input.email);

  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) {
    await dummyVerify(input.password);
    throw unauthenticated(INVALID_LOGIN);
  }
  const ok = await verifyPassword(user.passwordHash, input.password);
  const portalOk = portal === "ADMIN" ? user.role === "ADMIN" : true;
  if (!ok || user.status !== "ACTIVE" || !portalOk) {
    await audit({ actorId: null, action: "auth.login_failed", entityType: "User", entityId: user.id, metadata: { portal } });
    throw unauthenticated(INVALID_LOGIN);
  }
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, metadata: { portal } });
  const session = await createSession(user.id, user.role);
  return { user, session };
}

/**
 * Single-use "choose your password" link for a newly invited staff member.
 * Same mechanism as a reset, valid for 72 hours.
 */
export async function createPasswordSetupLink(userId: string): Promise<string> {
  const token = await issueToken(userId, "PASSWORD_RESET", 72 * 3600_000);
  return `${env().APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

// ─── Password reset ──────────────────────────────────────────────────────────

/** Always resolves the same way whether or not the email is registered. */
export async function requestPasswordReset(raw: Record<string, string>, ctx: RequestContext): Promise<void> {
  const input = parse(forgotPasswordSchema, raw);
  await enforce(LIMITS.passwordReset, ctx.ip);
  await enforce(LIMITS.passwordReset, `acct:${input.email}`);
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || user.status !== "ACTIVE") return;
  const token = await issueToken(user.id, "PASSWORD_RESET");
  await sendEmail(passwordResetEmail(user.email, `${env().APP_URL}/reset-password?token=${encodeURIComponent(token)}`));
  await audit({ actorId: user.id, action: "auth.password_reset_requested", entityType: "User", entityId: user.id });
}

export async function resetPassword(raw: Record<string, string>): Promise<void> {
  const input = parse(resetPasswordSchema, raw);
  const passwordHash = await hashPassword(input.password);
  const userId = await consumeToken(input.token, "PASSWORD_RESET");
  if (!userId) throw validationError("This reset link is invalid or has expired. Please request a new one.");
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  // Anyone holding an old session (e.g. on a lost device) is signed out.
  await invalidateUserSessions(userId);
  await audit({ actorId: userId, action: "auth.password_reset", entityType: "User", entityId: userId });
}

export async function changePassword(userId: string, raw: Record<string, string>, currentToken: string): Promise<void> {
  const input = parse(changePasswordSchema, raw);
  await enforce(LIMITS.loginAccount, `chpw:${userId}`);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw validationError("Please fix the highlighted fields.", { currentPassword: ["Your current password is incorrect"] });
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.password) } });
  await invalidateUserSessions(userId, currentToken);
  await audit({ actorId: userId, action: "auth.password_changed", entityType: "User", entityId: userId });
}

// ─── Account deletion (data-subject request) ─────────────────────────────────

/**
 * Permanently deletes a candidate's account, profile, CVs and applications.
 * Requires the current password. The audit entry keeps only the user ID.
 */
export async function deleteOwnAccount(userId: string, password: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== "CANDIDATE") throw validationError("Administrator accounts are removed with the admin CLI.");
  if (!(await verifyPassword(user.passwordHash, password ?? ""))) {
    throw validationError("Please fix the highlighted fields.", { password: ["Your password is incorrect"] });
  }
  await db.$transaction(async (tx) => {
    const files = await tx.storedFile.findMany({ where: { ownerId: userId }, select: { id: true } });
    await tx.candidateProfile.updateMany({ where: { userId }, data: { currentCvId: null } });
    await tx.application.deleteMany({ where: { candidateId: userId } });
    for (const f of files) await deleteStoredFile(tx, f.id);
    await tx.user.delete({ where: { id: userId } });
    await audit({ actorId: null, action: "account.deleted_by_owner", entityType: "User", entityId: userId }, tx);
  });
}
