import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { testOutbox } from "@/server/email/mailer";
import { applyToJob } from "@/server/services/application-service";
import { getFileForDownload } from "@/server/services/file-service";
import { getCompleteness, removeCurrentCv, removePhoto, uploadCv, uploadPhoto } from "@/server/services/profile-service";
import { getApplicationForAdmin } from "@/server/services/application-service";
import { updateSettings } from "@/server/services/settings-service";
import { getEnquiry, listEnquiries, submitCareerAssistance, submitContact, submitOutsourcing, updateEnquiry } from "@/server/services/enquiry-service";
import { listCandidates, setCandidateStatus } from "@/server/services/admin-service";
import { validateSessionToken, createSession } from "@/server/auth/session";
import { IP, makeAdmin, makeCandidate, makeJob, resetDb, samplePdf } from "../helpers";
import { sampleJpeg, solidPng } from "../image-fixtures";

beforeEach(resetDb);

describe("private CV storage", () => {
  it("stores CVs privately and authorises every download", async () => {
    const alice = await makeCandidate({ complete: true, name: "Alice Example" });
    const bob = await makeCandidate({ name: "Bob Example" });
    const admin = await makeAdmin();
    const file = await db.storedFile.findFirstOrThrow({ where: { ownerId: alice.id, kind: "CV" } });

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
    const first = await db.storedFile.findFirstOrThrow({ where: { ownerId: c.id, kind: "CV" } });
    await applyToJob(c, (await makeJob()).id, {});
    await uploadCv(c.id, { name: "new-cv.pdf", bytes: samplePdf("new") });
    expect(await db.storedFile.findUnique({ where: { id: first.id } })).not.toBeNull();
    await removeCurrentCv(c.id);
    // The replacement CV wasn't used in an application, so it's deleted outright.
    expect(await db.storedFile.count({ where: { ownerId: c.id, kind: "CV" } })).toBe(1);
  });
});

describe("passport photographs", () => {
  it("are private: owner and staff only, never other candidates or visitors", async () => {
    const alice = await makeCandidate({ complete: true, name: "Alice Example" });
    const bob = await makeCandidate({ complete: true, name: "Bob Example" });
    const admin = await makeAdmin();
    const photo = await db.storedFile.findFirstOrThrow({ where: { ownerId: alice.id, kind: "PHOTO" } });
    expect(photo.storageKey).toMatch(/^photo\/[0-9a-f-]{36}$/);
    expect(photo.mimeType).toBe("image/png");
    expect((await getFileForDownload(alice, photo.id)).file.id).toBe(photo.id);
    expect((await getFileForDownload(admin, photo.id)).file.id).toBe(photo.id);
    await expect(getFileForDownload(bob, photo.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getFileForDownload(null, photo.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("are required for a complete profile unless the admin turns the rule off", async () => {
    const admin = await makeAdmin();
    const c = await makeCandidate({ complete: true });
    await removePhoto(c.id);
    expect((await getCompleteness(c.id)).result.missing).toEqual(["photo"]);
    await expect(applyToJob(c, (await makeJob()).id, {})).rejects.toMatchObject({ name: "ProfileIncompleteError" });

    await updateSettings(admin, { publicJobPreview: "on", requireCvForProfile: "on", applicationsOpen: "on" });
    expect((await getCompleteness(c.id)).result.complete).toBe(true);
  });

  it("stores only JPEG/PNG, with metadata removed", async () => {
    const c = await makeCandidate();
    await expect(uploadPhoto(c.id, { name: "me.pdf", bytes: samplePdf() })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(uploadPhoto(c.id, { name: "me.jpg", bytes: solidPng(200, 200) })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(uploadPhoto(c.id, { name: "tiny.png", bytes: solidPng(40, 40) })).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await db.storedFile.count()).toBe(0);

    await uploadPhoto(c.id, { name: "me.jpg", bytes: sampleJpeg(300, 400, { orientation: 3, comment: "secret-comment" }) });
    const stored = await db.storedFile.findFirstOrThrow({ where: { ownerId: c.id, kind: "PHOTO" } });
    const { data } = await getFileForDownload(c, stored.id);
    expect(data.toString("latin1")).not.toContain("secret-comment");
    expect(data.toString("latin1")).not.toContain("GPS");
  });

  it("travel with the application and survive a later replacement", async () => {
    const admin = await makeAdmin();
    const c = await makeCandidate({ complete: true });
    const first = await db.storedFile.findFirstOrThrow({ where: { ownerId: c.id, kind: "PHOTO" } });
    const { applicationId } = await applyToJob(c, (await makeJob()).id, {});
    expect((await getApplicationForAdmin(admin, applicationId)).photoFile?.id).toBe(first.id);

    await uploadPhoto(c.id, { name: "new.png", bytes: solidPng(220, 220) });
    expect(await db.storedFile.findUnique({ where: { id: first.id } })).not.toBeNull();
    expect((await getApplicationForAdmin(admin, applicationId)).photoFile?.id).toBe(first.id);
    await removePhoto(c.id);
    expect(await db.storedFile.count({ where: { ownerId: c.id, kind: "PHOTO" } })).toBe(1);
  });
});

describe("enquiries", () => {
  const contact = { name: "Tunde Example", email: "tunde@example.test", phone: "0803 555 0101", subject: "Recruitment services", message: "We'd like to discuss a vacancy.", consent: "on" };

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
    // The client calls employers back, so a phone number is required.
    await expect(submitContact({ ...contact, phone: "" }, IP)).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { phone: expect.any(Array) } });
    const ip = "192.0.2.200";
    for (let i = 0; i < 6; i++) await submitContact(contact, ip);
    await expect(submitContact(contact, ip)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("career assistance requires a CV, which only admins can download", async () => {
    const form = { name: "Ngozi Example", email: "ngozi@example.test", phone: "08031234567", qualification: "HND", careerInterests: "Banking", message: "I'd like guidance on banking roles.", consent: "on" };
    await expect(submitCareerAssistance(form, null, IP)).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { attachment: expect.any(Array) } });
    expect(await db.enquiry.count()).toBe(0);
    const r = await submitCareerAssistance(form, { name: "cv.pdf", bytes: samplePdf() }, IP);
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
        { name: "Firm Example", email: "firm@example.test", phone: "08035550202", serviceType: "Outsourcing a project", message: "We need help with a data-entry project.", consent: "on" },
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
