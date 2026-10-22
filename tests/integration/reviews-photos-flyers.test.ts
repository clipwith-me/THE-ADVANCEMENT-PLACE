import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { testOutbox } from "@/server/email/mailer";
import { getFileForDownload, getPublicMedia } from "@/server/services/file-service";
import { createJob, getPublicJob, updateJob } from "@/server/services/job-service";
import { latestApprovedReviews, listApprovedReviews, listReviewsForAdmin, moderateReview, submitReview } from "@/server/services/review-service";
import { updateSettings } from "@/server/services/settings-service";
import {
  deleteSitePhoto,
  listSitePhotosForAdmin,
  moveSitePhoto,
  publishedSitePhotos,
  setSitePhotoPublished,
  uploadSitePhoto,
} from "@/server/services/site-content-service";
import { IP, makeAdmin, makeCandidate, makeCategory, resetDb, samplePdf, sampleDocx } from "../helpers";
import { decodableJpeg, pngChunk, solidPng } from "../image-fixtures";

beforeEach(resetDb);

const review = {
  name: "Ngozi Eze",
  email: "ngozi@example.test",
  reviewerType: "CANDIDATE",
  rating: "5",
  comment: "The team helped me prepare for my interview and I got the job.",
  consent: "on",
};

describe("reviews", () => {
  it("are stored pending, never public until an admin approves them", async () => {
    const r = await submitReview(review, IP);
    expect(r.notified).toBe(true);
    expect(testOutbox().at(-1)!.subject).toBe("New review awaiting approval");
    expect(await latestApprovedReviews()).toEqual([]);

    const admin = await makeAdmin();
    await moderateReview(admin, r.id, "approve");
    const [shown] = await latestApprovedReviews();
    expect(shown).toMatchObject({ displayName: "Ngozi E.", rating: 5, reviewerType: "CANDIDATE" });
    // Public data never carries the email or full name.
    expect(JSON.stringify(shown)).not.toContain("ngozi@example.test");
    expect(JSON.stringify(shown)).not.toContain("Eze");

    await moderateReview(admin, r.id, "reject");
    expect((await listApprovedReviews()).total).toBe(0);
    expect(await db.auditEvent.count({ where: { entityType: "Review", entityId: r.id } })).toBe(2);
  });

  it("only admins can see or moderate reviews", async () => {
    const r = await submitReview(review, IP);
    const cand = await makeCandidate();
    await expect(moderateReview(cand, r.id, "approve")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listReviewsForAdmin(cand, { status: "PENDING", page: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await db.review.findUniqueOrThrow({ where: { id: r.id } })).status).toBe("PENDING");
  });

  it("validates input, blocks mass assignment and enforces 1–5 stars", async () => {
    for (const bad of [{ rating: "0" }, { rating: "6" }, { rating: "4.5" }, { comment: "Too short" }, { consent: "" }, { reviewerType: "ADMIN" }]) {
      await expect(submitReview({ ...review, ...bad }, IP)).rejects.toMatchObject({ code: "VALIDATION" });
    }
    const r = await submitReview({ ...review, status: "APPROVED", moderatedAt: "2026-01-01" } as Record<string, string>, IP);
    expect((await db.review.findUniqueOrThrow({ where: { id: r.id } })).status).toBe("PENDING");
    // The database refuses out-of-range ratings even if the app didn't.
    await expect(db.review.create({ data: { name: "X", email: "x@example.test", reviewerType: "OTHER", rating: 9, comment: "x" } })).rejects.toThrow();
  });

  it("deletes spam permanently and rate-limits submissions", async () => {
    const admin = await makeAdmin();
    const r = await submitReview(review, IP);
    await moderateReview(admin, r.id, "delete");
    expect(await db.review.count()).toBe(0);
    const ip = "192.0.2.77";
    for (let i = 0; i < 5; i++) await submitReview(review, ip);
    await expect(submitReview(review, ip)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("website photos", () => {
  it("are resized, stripped of metadata, and public only while shown", async () => {
    const admin = await makeAdmin();
    const big = solidPng(2600, 1800, [10, 120, 60], [pngChunk("tEXt", Buffer.from("Comment\0secret-gps", "latin1"))]);
    const photo = await uploadSitePhoto(admin, { name: "office.png", bytes: big }, { caption: "Our reception at Oke-Ilewo" });
    const { file, data, isPublic } = await getPublicMedia(null, photo.fileId);
    expect(isPublic).toBe(true);
    expect(file.mimeType).toBe("image/jpeg");
    expect(data.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    expect(data.toString("latin1")).not.toContain("secret-gps");
    const sharp = (await import("sharp")).default;
    const meta = await sharp(data).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBe(2000);

    await setSitePhotoPublished(admin, photo.id, false);
    expect(await publishedSitePhotos()).toEqual([]);
    await expect(getPublicMedia(null, photo.fileId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getPublicMedia(admin, photo.fileId)).isPublic).toBe(false); // admin preview still works
  });

  it("only admins can manage them; captions are required; order can change", async () => {
    const admin = await makeAdmin();
    const cand = await makeCandidate();
    const img = { name: "a.jpg", bytes: solidPng(400, 300) };
    await expect(uploadSitePhoto(cand, img, { caption: "Team" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(uploadSitePhoto(admin, { name: "a.png", bytes: solidPng(400, 300) }, { caption: "" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(uploadSitePhoto(admin, { name: "a.pdf", bytes: samplePdf() }, { caption: "Team" })).rejects.toMatchObject({ code: "VALIDATION" });

    const a = await uploadSitePhoto(admin, { name: "a.png", bytes: solidPng(400, 300) }, { caption: "First photo" });
    const b = await uploadSitePhoto(admin, { name: "b.png", bytes: solidPng(400, 300) }, { caption: "Second photo" });
    expect((await publishedSitePhotos()).map((p) => p.id)).toEqual([a.id, b.id]);
    await moveSitePhoto(admin, b.id, "up");
    expect((await publishedSitePhotos()).map((p) => p.id)).toEqual([b.id, a.id]);

    await deleteSitePhoto(admin, a.id);
    expect((await listSitePhotosForAdmin(admin)).map((p) => p.id)).toEqual([b.id]);
    expect(await db.storedFile.count({ where: { id: a.fileId } })).toBe(0);
    expect(await db.fileBlob.count()).toBe(1);
  });

  it("private files are never served as public media", async () => {
    const cand = await makeCandidate({ complete: true });
    const cv = await db.storedFile.findFirstOrThrow({ where: { ownerId: cand.id, kind: "CV" } });
    const photo = await db.storedFile.findFirstOrThrow({ where: { ownerId: cand.id, kind: "PHOTO" } });
    const admin = await makeAdmin();
    for (const id of [cv.id, photo.id]) {
      await expect(getPublicMedia(null, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(getPublicMedia(admin, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
  });
});

describe("job flyers", () => {
  const input = (categoryId: string) => ({
    title: "Sales Representative",
    categoryId,
    summary: "Grow sales across Abeokuta for a well-known distributor.",
    description: "A full description of the role that is comfortably longer than fifty characters.",
    responsibilities: "Visit customers\nReport sales",
    requirements: "One year's experience",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    state: "Ogun",
  });

  it("is optional, public while the job is visible, and replaceable", async () => {
    const admin = await makeAdmin();
    const cat = await makeCategory();
    const plain = await createJob(admin, input(cat.id), "publish");
    expect(plain.flyerId).toBeNull();

    const draft = await createJob(admin, input(cat.id), "draft", { upload: { name: "flyer.jpg", bytes: await decodableJpeg(500, 700) } });
    const flyerId = draft.flyerId!;
    // Draft job: flyer hidden from the public, visible to admins.
    await expect(getPublicMedia(null, flyerId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getPublicMedia(admin, flyerId)).file.kind).toBe("JOB_FLYER");

    await updateJob(admin, draft.id, input(cat.id), "publish");
    const pub = await getPublicJob(draft.slug);
    expect(pub?.job.flyer?.id).toBe(flyerId);
    expect((await getPublicMedia(null, flyerId)).isPublic).toBe(true);

    // Replacing deletes the old file; removing clears it.
    await updateJob(admin, draft.id, input(cat.id), "save", { upload: { name: "flyer.pdf", bytes: samplePdf() } });
    const replaced = (await db.job.findUniqueOrThrow({ where: { id: draft.id } })).flyerId!;
    expect(replaced).not.toBe(flyerId);
    expect(await db.storedFile.count({ where: { id: flyerId } })).toBe(0);
    expect((await getPublicMedia(null, replaced)).file.mimeType).toBe("application/pdf");
    await updateJob(admin, draft.id, input(cat.id), "save", { remove: true });
    expect((await db.job.findUniqueOrThrow({ where: { id: draft.id } })).flyerId).toBeNull();
    expect(await db.storedFile.count({ where: { kind: "JOB_FLYER" } })).toBe(0);
  });

  it("follows the job-advert privacy setting and rejects other file types", async () => {
    const admin = await makeAdmin();
    const cat = await makeCategory();
    const job = await createJob(admin, input(cat.id), "publish", { upload: { name: "flyer.png", bytes: solidPng(600, 800) } });
    await updateSettings(admin, { requireCvForProfile: "on", requirePhotoForProfile: "on", applicationsOpen: "on" }); // adverts private
    await expect(getPublicMedia(null, job.flyerId!)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getPublicMedia(await makeCandidate(), job.flyerId!)).file.id).toBe(job.flyerId);

    await expect(createJob(admin, input(cat.id), "publish", { upload: { name: "flyer.docx", bytes: sampleDocx() } })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createJob(admin, input(cat.id), "publish", { upload: { name: "flyer.gif", bytes: Buffer.from("GIF89a") } })).rejects.toMatchObject({ code: "VALIDATION" });
    // A failed upload creates neither the job nor a file.
    expect(await db.job.count()).toBe(1);
    expect(await db.storedFile.count({ where: { kind: "JOB_FLYER" } })).toBe(1);
    // Flyers are public media, never served by the private download endpoint to candidates.
    await expect(getFileForDownload(await makeCandidate(), job.flyerId!)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
