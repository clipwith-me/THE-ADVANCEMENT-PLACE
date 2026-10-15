import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hmacHex } from "@/lib/crypto";
import { rateLimited } from "@/lib/errors";

/**
 * Fixed-window rate limiting backed by PostgreSQL so limits hold across
 * serverless instances without another paid service. One atomic upsert per
 * check. Identifiers are HMAC'd so raw IPs/emails are never stored.
 */
export interface Limit {
  name: string;
  max: number;
  windowSeconds: number;
}

export const LIMITS = {
  login: { name: "login", max: 10, windowSeconds: 15 * 60 },
  loginAccount: { name: "login-acct", max: 8, windowSeconds: 15 * 60 },
  register: { name: "register", max: 5, windowSeconds: 60 * 60 },
  passwordReset: { name: "pw-reset", max: 5, windowSeconds: 60 * 60 },
  verificationEmail: { name: "verify-email", max: 5, windowSeconds: 60 * 60 },
  publicForm: { name: "public-form", max: 6, windowSeconds: 60 * 60 },
  upload: { name: "upload", max: 20, windowSeconds: 60 * 60 },
  apply: { name: "apply", max: 30, windowSeconds: 60 * 60 },
} satisfies Record<string, Limit>;

export function rateKey(limit: Limit, identifier: string): string {
  return `${limit.name}:${hmacHex(env().SESSION_SECRET, identifier.toLowerCase()).slice(0, 32)}`;
}

/** Counts one hit; returns false when the caller is over the limit. */
export async function hit(limit: Limit, identifier: string, now = new Date()): Promise<boolean> {
  const windowMs = limit.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const key = rateKey(limit, identifier);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
    RETURNING "count"`;
  // Opportunistic cleanup keeps the table small without a scheduler.
  if (Math.random() < 0.01) {
    await db.rateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 3600_000) } } });
  }
  return (rows[0]?.count ?? 0) <= limit.max;
}

/** Throws a RATE_LIMITED AppError when over the limit. */
export async function enforce(limit: Limit, identifier: string): Promise<void> {
  if (!(await hit(limit, identifier))) throw rateLimited();
}
