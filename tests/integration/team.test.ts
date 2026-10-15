import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { testOutbox } from "@/server/email/mailer";
import { createSession, validateSessionToken } from "@/server/auth/session";
import { login, resetPassword } from "@/server/services/auth-service";
import { inviteAdmin, listAdmins, setAdminStatus } from "@/server/services/team-service";
import { IP, makeAdmin, makeCandidate, resetDb } from "../helpers";

beforeEach(resetDb);

describe("staff management", () => {
  it("an admin invites a new admin, who sets a password via the emailed link and signs in", async () => {
    const admin = await makeAdmin();
    const r = await inviteAdmin({ ...admin, name: "Funmi" }, { name: "Kola Staff", email: "kola@example.test" });
    expect(r).toEqual({ emailed: true, promoted: false });
    const mail = testOutbox().at(-1)!;
    expect(mail.to).toBe("kola@example.test");
    const token = decodeURIComponent(/token=([^\s"&]+)/.exec(mail.text)![1]!);
    // The random initial password is unusable; the invite link sets the real one.
    await resetPassword({ token, password: "Kola-staff-pass-2026", confirmPassword: "Kola-staff-pass-2026" });
    const { user } = await login({ email: "kola@example.test", password: "Kola-staff-pass-2026" }, { ip: IP }, "ADMIN");
    expect(user.role).toBe("ADMIN");
    expect(await db.auditEvent.count({ where: { action: "admin.invite" } })).toBe(1);
  });

  it("promotes an existing candidate and ends their sessions", async () => {
    const admin = await makeAdmin();
    const c = await makeCandidate();
    const { token } = await createSession(c.id, "CANDIDATE");
    expect((await inviteAdmin(admin, { name: "Ada", email: c.email })).promoted).toBe(true);
    expect(await validateSessionToken(token)).toBeNull();
    await expect(inviteAdmin(admin, { name: "Ada", email: c.email })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("only admins manage staff; candidates are refused", async () => {
    const c = await makeCandidate();
    await expect(inviteAdmin(c, { name: "Eve", email: "eve@example.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listAdmins(c)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("removing access suspends and signs out; can't remove yourself or the last active admin", async () => {
    const a = await makeAdmin();
    const b = await makeAdmin();
    const { token } = await createSession(b.id, "ADMIN");
    await expect(setAdminStatus(a, a.id, "SUSPENDED")).rejects.toMatchObject({ code: "VALIDATION" });
    await setAdminStatus(a, b.id, "SUSPENDED");
    expect(await validateSessionToken(token)).toBeNull();
    await expect(login({ email: b.email, password: "Admin-Password-123" }, { ip: IP }, "ADMIN")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await setAdminStatus(a, b.id, "ACTIVE");
    // b is now the only other active admin; suspending a via b leaves b, so allowed; then a can't remove b.
    await setAdminStatus(b, a.id, "SUSPENDED");
    await db.user.update({ where: { id: a.id }, data: { status: "ACTIVE" } });
    await db.user.update({ where: { id: b.id }, data: { status: "SUSPENDED" } });
    const c2 = await makeAdmin();
    await db.user.update({ where: { id: c2.id }, data: { status: "SUSPENDED" } });
    await expect(setAdminStatus(c2, a.id, "SUSPENDED")).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
