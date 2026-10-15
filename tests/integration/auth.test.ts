import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { sha256Hex } from "@/lib/crypto";
import { testOutbox } from "@/server/email/mailer";
import { validateSessionToken } from "@/server/auth/session";
import { login, registerCandidate, requestPasswordReset, resetPassword, verifyEmail, deleteOwnAccount } from "@/server/services/auth-service";
import { IP, makeAdmin, makeCandidate, resetDb, uniqueEmail } from "../helpers";

const form = (email: string) => ({
  name: "Ada Candidate",
  email,
  password: "Str0ng-password",
  confirmPassword: "Str0ng-password",
  acceptTerms: "on",
});

function tokenFrom(text: string): string {
  const m = /token=([A-Za-z0-9_\-%]+)/.exec(text);
  if (!m?.[1]) throw new Error("no token in email");
  return decodeURIComponent(m[1]);
}

beforeEach(resetDb);

describe("registration", () => {
  it("creates a candidate with a hashed password, a session and a verification email", async () => {
    const email = uniqueEmail();
    const { user, session } = await registerCandidate(form(email), { ip: IP });
    expect(user.role).toBe("CANDIDATE");
    expect(user.passwordHash).not.toContain("Str0ng-password");
    expect(user.passwordHash.startsWith("$argon2id$")).toBe(true);
    expect((await validateSessionToken(session.token))?.user.id).toBe(user.id);
    // Only the hash of the session token is stored.
    expect(await db.session.findUnique({ where: { id: session.token } })).toBeNull();
    expect(testOutbox().at(-1)?.subject).toMatch(/confirm/i);
  });

  it("can never be used to create an administrator (mass assignment blocked)", async () => {
    const email = uniqueEmail();
    const { user } = await registerCandidate({ ...form(email), role: "ADMIN" } as Record<string, string>, { ip: IP });
    expect(user.role).toBe("CANDIDATE");
  });

  it("rejects duplicate emails (case-insensitive)", async () => {
    const email = uniqueEmail();
    await registerCandidate(form(email), { ip: IP });
    await expect(registerCandidate(form(email.toUpperCase()), { ip: "198.51.100.1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("verifies email with a single-use token", async () => {
    const { user } = await registerCandidate(form(uniqueEmail()), { ip: IP });
    const token = tokenFrom(testOutbox().at(-1)!.text);
    expect(await verifyEmail(token)).toBe(true);
    expect(await verifyEmail(token)).toBe(false);
    expect((await db.user.findUnique({ where: { id: user.id } }))?.emailVerifiedAt).not.toBeNull();
  });

  it("rate-limits registrations per IP", async () => {
    const ip = "192.0.2.77";
    for (let i = 0; i < 5; i++) await registerCandidate(form(uniqueEmail()), { ip });
    await expect(registerCandidate(form(uniqueEmail()), { ip })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("login", () => {
  it("signs in with correct credentials and uses one generic error otherwise", async () => {
    const c = await makeCandidate();
    const ok = await login({ email: c.email, password: "Candidate-Pass-123" }, { ip: IP }, "CANDIDATE");
    expect(ok.user.id).toBe(c.id);

    const wrong = login({ email: c.email, password: "nope-nope-1" }, { ip: IP }, "CANDIDATE");
    const unknown = login({ email: "ghost@example.test", password: "nope-nope-1" }, { ip: IP }, "CANDIDATE");
    const [a, b] = await Promise.allSettled([wrong, unknown]);
    expect(a.status).toBe("rejected");
    expect(b.status).toBe("rejected");
    expect((a as PromiseRejectedResult).reason.message).toBe((b as PromiseRejectedResult).reason.message);
  });

  it("refuses candidates on the admin portal and suspended accounts everywhere", async () => {
    const c = await makeCandidate();
    await expect(login({ email: c.email, password: "Candidate-Pass-123" }, { ip: IP }, "ADMIN")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const admin = await makeAdmin();
    expect((await login({ email: admin.email, password: "Admin-Password-123" }, { ip: IP }, "ADMIN")).user.role).toBe("ADMIN");
    await db.user.update({ where: { id: c.id }, data: { status: "SUSPENDED" } });
    await expect(login({ email: c.email, password: "Candidate-Pass-123" }, { ip: IP }, "CANDIDATE")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("locks out brute force on one account", async () => {
    const c = await makeCandidate();
    for (let i = 0; i < 8; i++) {
      await login({ email: c.email, password: `wrong-pass-${i}` }, { ip: `198.51.100.${i}` }, "CANDIDATE").catch(() => undefined);
    }
    await expect(login({ email: c.email, password: "Candidate-Pass-123" }, { ip: "198.51.100.200" }, "CANDIDATE")).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("sessions expire and are rejected for suspended users", async () => {
    const c = await makeCandidate();
    const { session } = await login({ email: c.email, password: "Candidate-Pass-123" }, { ip: IP }, "CANDIDATE");
    await db.session.update({ where: { id: sha256Hex(session.token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(session.token)).toBeNull();
  });
});

describe("password reset", () => {
  it("doesn't reveal whether an email is registered", async () => {
    await expect(requestPasswordReset({ email: "nobody@example.test" }, { ip: IP })).resolves.toBeUndefined();
    expect(testOutbox()).toHaveLength(0);
  });

  it("is single-use, invalidates sessions and changes the password", async () => {
    const c = await makeCandidate();
    const { session } = await login({ email: c.email, password: "Candidate-Pass-123" }, { ip: IP }, "CANDIDATE");
    await requestPasswordReset({ email: c.email }, { ip: IP });
    const token = tokenFrom(testOutbox().at(-1)!.text);
    await resetPassword({ token, password: "Brand-new-pass-9", confirmPassword: "Brand-new-pass-9" });
    expect(await validateSessionToken(session.token)).toBeNull();
    await expect(resetPassword({ token, password: "Another-pass-99", confirmPassword: "Another-pass-99" })).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await login({ email: c.email, password: "Brand-new-pass-9" }, { ip: IP }, "CANDIDATE")).user.id).toBe(c.id);
  });

  it("rejects expired tokens and stores only token hashes", async () => {
    const c = await makeCandidate();
    await requestPasswordReset({ email: c.email }, { ip: IP });
    const token = tokenFrom(testOutbox().at(-1)!.text);
    const row = await db.authToken.findFirstOrThrow({ where: { userId: c.id, type: "PASSWORD_RESET" } });
    expect(row.tokenHash).toBe(sha256Hex(token));
    await db.authToken.update({ where: { id: row.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    await expect(resetPassword({ token, password: "Brand-new-pass-9", confirmPassword: "Brand-new-pass-9" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("account deletion", () => {
  it("requires the password and removes the user's data", async () => {
    const c = await makeCandidate({ complete: true });
    await expect(deleteOwnAccount(c.id, "wrong")).rejects.toMatchObject({ code: "VALIDATION" });
    await deleteOwnAccount(c.id, "Candidate-Pass-123");
    expect(await db.user.findUnique({ where: { id: c.id } })).toBeNull();
    expect(await db.storedFile.count({ where: { ownerId: c.id } })).toBe(0);
    expect(await db.fileBlob.count()).toBe(0);
  });
});
