import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { testOutbox } from "@/server/email/mailer";
import { applyToJob } from "@/server/services/application-service";
import { getFileForDownload } from "@/server/services/file-service";
import { removeCurrentCv, uploadCv } from "@/server/services/profile-service";
import { getEnquiry, listEnquiries, submitCareerAssistance, submitContact, submitOutsourcing, updateEnquiry } from "@/server/services/enquiry-service";
import { listCandidates, setCandidateStatus } from "@/server/services/admin-service";
import { validateSessionToken, createSession } from "@/server/auth/session";
import { IP, makeAdmin, makeCandidate, makeJob, resetDb, samplePdf } from "../helpers";

beforeEach(resetDb);

describe("private CV storage", () => {
  it("stores CVs privately and authorises every download", async () => {
    const alice = await makeCandidate({ complete: true, name: "Alice Example" });
    const bob = await makeCandidate({ name: "Bob Example" });
    const admin = await makeAdmin();
    const file = await db.storedFile.findFirstOrThrow({ where: { ownerId: alice.id } });

    // Owner and admin can download; other candidates and anonymous users get "not found".
    expect((await getFileForDownload(alice, file.id)).data.subarray(0, 5).toString()).toBe("%PDF-");
    expect((await getFileForDownload(admin, file.id)).file.id).toBe(file.id);
    await expect(getFileForDownload(bob, file.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getFileForDownload(null, file.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getFileForDownload(alice, "../../etc/passwd")).rejects.toMatchObject({ code: "NOT_FOUND" });

    // Storage key is server-generated, not derived from the uploaded filename.
    expect(file.storageKey).toMatch(/^cv\/[0-9a-f-]{36}$/);
    expect(file.mimeType).toBe("application/pdf");
  });

  it("rejects invalid uploads with a field error", async () => {
    const c = await makeCandidate();
    await expect(uploadCv(c.id, { name: "virus.exe", bytes: Buffer.from("MZ....") })).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { file: [expect.stringMatching(/PDF or Word/)] },
    });
    await expect(uploadCv(c.id, { name: "fake.pdf", bytes: Buffer.from("<html>not a pdf</html>") })).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await db.storedFile.count()).toBe(0);
  });

  it("keeps the CV attached to an application when the candidate replaces it", async () => {
    const c = await makeCandidate({ complete: true });
    const first = await db.storedFile.findFirstOrThrow({ where: { ownerId: c.id } });
    await applyToJob(c, (await makeJob()).id, {});
    await uploadCv(c.id, { name: "new-cv.pdf", bytes: samplePdf("new") });
    expect(await db.storedFile.findUnique({ where: { id: first.id } })).not.toBeNull();
    await removeCurrentCv(c.id);
    // The replacement CV wasn't used in an application, so it's deleted outright.
    expect(await db.storedFile.count({ where: { ownerId: c.id } })).toBe(1);
  });
});

describe("enquiries", () => {
  const contact = { name: "Tunde Example", email: "tunde@example.test", subject: "Recruitment services", message: "We'd like to discuss a vacancy.", consent: "on" };

  it("persists contact submissions and notifies the business inbox", async () => {
    const r = await submitContact(contact, IP);
    expect(r.notified).toBe(true);
    const row = await db.enquiry.findUniqueOrThrow({ where: { id: r.id } });
    expect(row.type).toBe("CONTACT");
    expect(row.notifiedAt).not.toBeNull();
    const mail = testOutbox().at(-1)!;
    expect(mail.to).toBe("advancementplace@gmail.com");
    expect(mail.replyTo).toBe("tunde@example.test");
  });

  it("stores hostile input verbatim and escapes it in notification HTML", async () => {
    const r = await submitContact({ ...contact, message: `<img src=x onerror=alert(1)> please call` }, IP);
    expect((await db.enquiry.findUniqueOrThrow({ where: { id: r.id } })).message).toContain("<img");
    expect(testOutbox().at(-1)!.html).not.toContain("<img src=x");
    expect(testOutbox().at(-1)!.html).toContain("&lt;img");
  });

  it("validates and rate-limits public forms", async () => {
    await expect(submitContact({ ...contact, email: "not-an-email" }, IP)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(submitContact({ ...contact, consent: "" }, IP)).rejects.toMatchObject({ code: "VALIDATION" });
    const ip = "192.0.2.200";
    for (let i = 0; i < 6; i++) await submitContact(contact, ip);
    await expect(submitContact(contact, ip)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("career assistance accepts an optional CV attachment that only admins can download", async () => {
    const r = await submitCareerAssistance(
      { name: "Ngozi Example", email: "ngozi@example.test", phone: "08031234567", qualification: "HND", careerInterests: "Banking", message: "I'd like guidance on banking roles.", consent: "on" },
      { name: "cv.pdf", bytes: samplePdf() },
      IP,
    );
    const admin = await makeAdmin();
    const candidate = await makeCandidate();
    const e = await getEnquiry(admin, "CAREER_ASSISTANCE", r.id);
    expect(e.attachment).not.toBeNull();
    await expect(getFileForDownload(candidate, e.attachment!.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getFileForDownload(admin, e.attachment!.id)).file.kind).toBe("ENQUIRY_ATTACHMENT");
  });

  it("rejects unsafe attachments without storing the enquiry", async () => {
    await expect(
      submitOutsourcing(
        { name: "Firm Example", email: "firm@example.test", serviceType: "Outsourcing a project", message: "We need help with a data-entry project.", consent: "on" },
        { name: "proposal.pdf", bytes: samplePdf("/JavaScript") },
        IP,
      ),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await db.enquiry.count()).toBe(0);
  });

  it("only admins can list and update enquiries", async () => {
    const r = await submitContact(contact, IP);
    const admin = await makeAdmin();
    const cand = await makeCandidate();
    await expect(listEnquiries(cand, "CONTACT", { page: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await updateEnquiry(admin, r.id, { status: "RESOLVED", adminNotes: "Called back." });
    expect((await listEnquiries(admin, "CONTACT", { status: "RESOLVED", page: 1 })).total).toBe(1);
  });
});

describe("candidate administration", () => {
  it("never exposes password hashes and suspension revokes sessions", async () => {
    const admin = await makeAdmin();
    const c = await makeCandidate();
    const list = await listCandidates(admin, { page: 1 });
    expect(JSON.stringify(list)).not.toContain("passwordHash");
    expect(JSON.stringify(list)).not.toContain("$argon2");
    const { token } = await createSession(c.id, "CANDIDATE");
    await setCandidateStatus(admin, c.id, "SUSPENDED");
    expect(await validateSessionToken(token)).toBeNull();
    await expect(setCandidateStatus(c, c.id, "ACTIVE")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
