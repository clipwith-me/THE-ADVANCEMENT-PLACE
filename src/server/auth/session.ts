import { db } from "@/lib/db";
import { randomToken, sha256Hex } from "@/lib/crypto";
import type { Role } from "@/generated/prisma/enums";

/**
 * Database-backed sessions. The browser holds a random 256-bit token in an
 * HttpOnly cookie; only its SHA-256 is stored, so a database leak doesn't
 * yield usable sessions. Sessions can be revoked server-side at any time
 * (logout, password change/reset, suspension).
 */
const DAY = 86_400_000;
export const SESSION_TTL: Record<Role, number> = {
  CANDIDATE: 30 * DAY,
  ADMIN: 12 * 60 * 60 * 1000, // admins re-authenticate at least twice a day
};

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerifiedAt: Date | null;
}

export async function createSession(userId: string, role: Role): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL[role]);
  await db.session.create({ data: { id: sha256Hex(token), userId, expiresAt } });
  return { token, expiresAt };
}

/** Returns the session's user, or null when the token is unknown, expired or the account is suspended. */
export async function validateSessionToken(token: string): Promise<{ user: SessionUser; expiresAt: Date } | null> {
  if (!token || token.length > 200) return null;
  const id = sha256Hex(token);
  const session = await db.session.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true, role: true, status: true, emailVerifiedAt: true } } },
  });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now || session.user.status !== "ACTIVE") {
    await db.session.deleteMany({ where: { id } });
    return null;
  }
  let expiresAt = session.expiresAt;
  // Sliding expiry for candidates: refresh once less than half the lifetime remains.
  const ttl = SESSION_TTL[session.user.role];
  if (session.user.role === "CANDIDATE" && expiresAt.getTime() - now < ttl / 2) {
    expiresAt = new Date(now + ttl);
    await db.session.update({ where: { id }, data: { expiresAt, lastSeenAt: new Date() } });
  }
  const { status: _status, ...user } = session.user;
  return { user, expiresAt };
}

export async function invalidateSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { id: sha256Hex(token) } });
}

export async function invalidateUserSessions(userId: string, exceptToken?: string): Promise<void> {
  await db.session.deleteMany({
    where: { userId, ...(exceptToken ? { NOT: { id: sha256Hex(exceptToken) } } : {}) },
  });
}
