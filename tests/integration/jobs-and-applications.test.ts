import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { parseJobSearch } from "@/lib/validation/job";
import { testOutbox } from "@/server/email/mailer";
import {
  applyToJob,
  getMyApplication,
  listMyApplications,
  ProfileIncompleteError,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationForAdmin,
} from "@/server/services/application-service";
import { createJob, getPublicJob, searchJobs, transitionJob, updateJob } from "@/server/services/job-service";
import { getCompleteness, saveProfile } from "@/server/services/profile-service";
import { updateSettings } from "@/server/services/settings-service";
import { completeProfileForm, makeAdmin, makeCandidate, makeCategory, makeJob, resetDb } from "../helpers";

beforeEach(resetDb);

const DAY = 86_400_000;

describe("public job visibility and search", () => {
  it("lists only live jobs — never drafts, closed, archived or expired", async () => {
    const live = await makeJob({ title: "Live Role" });
    await makeJob({ title: "Draft Role", status: "DRAFT", publishedAt: null });
    await makeJob({ title: "Closed Role", status: "CLOSED" });
    await makeJob({ title: "Archived Role", status: "ARCHIVED" });
    await makeJob({ title: "Expired Role", deadline: new Date(Date.now() - DAY) });
    const r = await searchJobs(parseJobSearch({}));
    expect(r.items.map((j) => j.id)).toEqual([live.id]);
  });

  it("resolves public pages for live/expired/closed but not drafts", async () => {
    const draft = await makeJob({ status: "DRAFT", publishedAt: null });
    const expired = await makeJob({ deadline: new Date(Date.now() - DAY) });
    expect(await getPublicJob(draft.slug)).toBeNull();
    expect((await getPublicJob(expired.slug))?.state).toBe("EXPIRED");
  });

  it("combines keyword, location, type, arrangement and category filters", async () => {
    const it2 = await makeCategory("Information Technology");
    const a = await makeJob({ title: "React Developer", employmentType: "CONTRACT", workArrangement: "REMOTE", state: "Lagos", categoryId: it2.id });
    await makeJob({ title: "React Developer", employmentType: "FULL_TIME", workArrangement: "ONSITE", state: "Lagos", categoryId: it2.id });
    await makeJob({ title: "Accountant", employmentType: "CONTRACT", workArrangement: "REMOTE", state: "Lagos" });
    const r = await searchJobs(parseJobSearch({ q: "react", location: "lagos", type: "CONTRACT", arrangement: "REMOTE", category: it2.slug }));
    expect(r.items.map((j) => j.id)).toEqual([a.id]);
  });

  it("paginates on the server", async () => {
    for (let i = 0; i < 12; i++) await makeJob({ title: `Role ${i}`, publishedAt: new Date(Date.now() - i * 1000 - DAY) });
    const p1 = await searchJobs(parseJobSearch({}));
    const p2 = await searchJobs(parseJobSearch({ page: "2" }));
    expect(p1.items).toHaveLength(10);
    expect(p2.items).toHaveLength(2);
    expect(p1.pageCount).toBe(2);
  });

  it("treats SQL injection attempts as plain search text", async () => {
    await makeJob();
    const r = await searchJobs(parseJobSearch({ q: "' OR 1=1; DROP TABLE \"Job\"; --" }));
    expect(r.total).toBe(0);
    expect(await db.job.count()).toBe(1);
  });
});

describe("admin job management", () => {
  const input = (categoryId: string, extra: Record<string, string> = {}) => ({
    title: "Customer Service Representative",
    categoryId,
    summary: "Help customers by phone, email and in person every day.",
    description: "A full description of the role that is comfortably longer than fifty characters.",
    responsibilities: "Answer calls\nResolve issues",
    requirements: "One year's experience",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    state: "Ogun",
    ...extra,
  });

  it("only admins can create jobs", async () => {
    const cat = await makeCategory();
    const cand = await makeCandidate();
    await expect(createJob(cand, input(cat.id), "publish")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates drafts, publishes, closes, archives and reopens with an audit trail", async () => {
    const cat = await makeCategory();
    const admin = await makeAdmin();
    const job = await createJob(admin, input(cat.id), "draft");
    expect(job.status).toBe("DRAFT");
    expect((await searchJobs(parseJobSearch({}))).total).toBe(0);
    await transitionJob(admin, job.id, "publish");
    expect((await searchJobs(parseJobSearch({}))).total).toBe(1);
    await transitionJob(admin, job.id, "close");
    expect((await searchJobs(parseJobSearch({}))).total).toBe(0);
    await expect(transitionJob(admin, job.id, "close")).rejects.toMatchObject({ code: "VALIDATION" });
    await transitionJob(admin, job.id, "archive");
    await transitionJob(admin, job.id, "reopen");
    expect((await db.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("DRAFT");
    expect(await db.auditEvent.count({ where: { entityId: job.id } })).toBeGreaterThanOrEqual(5);
  });

  it("refuses to publish with a past deadline and validates input", async () => {
    const cat = await makeCategory();
    const admin = await makeAdmin();
    await expect(createJob(admin, input(cat.id, { deadline: "2020-01-01" }), "publish")).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createJob(admin, input(cat.id, { title: "" }), "draft")).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createJob(admin, input("nonexistent-category"), "draft")).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("ignores mass-assigned fields like status, isDemo or createdById", async () => {
    const cat = await makeCategory();
    const admin = await makeAdmin();
    const job = await createJob(admin, input(cat.id, { status: "PUBLISHED", isDemo: "true", createdById: "someone" }), "draft");
    expect(job.status).toBe("DRAFT");
    expect(job.isDemo).toBe(false);
    expect(job.createdById).toBe(admin.id);
    const updated = await updateJob(admin, job.id, input(cat.id, { title: "Updated Title" }), "save");
    expect(updated.title).toBe("Updated Title");
    expect(updated.status).toBe("DRAFT");
  });
});

describe("profile gate and applications", () => {
  it("NYSC is optional and the profile is incomplete until a photo and CV are uploaded", async () => {
    const c = await makeCandidate();
    const r = await saveProfile(c.id, completeProfileForm(), "core");
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["photo", "cv"]);
    await updateSettings(await makeAdmin(), { requireCvForProfile: "", requirePhotoForProfile: "", publicJobPreview: "on", applicationsOpen: "on" });
    expect((await getCompleteness(c.id)).result.complete).toBe(true);
  });

  it("blocks applications until the profile is complete", async () => {
    const c = await makeCandidate();
    const job = await makeJob();
    await expect(applyToJob(c, job.id, {})).rejects.toBeInstanceOf(ProfileIncompleteError);
  });

  it("submits an application with a snapshot and confirmation email", async () => {
    const c = await makeCandidate({ complete: true });
    const job = await makeJob();
    const { applicationId, confirmationEmail } = await applyToJob(c, job.id, { coverMessage: "Keen to help." });
    expect(confirmationEmail.delivered).toBe(true);
    const app = await db.application.findUniqueOrThrow({ where: { id: applicationId } });
    expect(app.status).toBe("SUBMITTED");
    expect(app.cvFileId).not.toBeNull();
    expect((app.profileSnapshot as { phone: string }).phone).toBe("+2348031234567");
    expect(testOutbox().some((m) => m.subject.startsWith("Application received"))).toBe(true);
  });

  it("prevents duplicate applications, including concurrent double-submits", async () => {
    const c = await makeCandidate({ complete: true });
    const job = await makeJob();
    const results = await Promise.allSettled([applyToJob(c, job.id, {}), applyToJob(c, job.id, {}), applyToJob(c, job.id, {})]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results.filter((x) => x.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason).toMatchObject({ code: "CONFLICT" });
    }
    expect(await db.application.count()).toBe(1);
    await expect(applyToJob(c, job.id, {})).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects applications to draft, closed and expired jobs, and when paused", async () => {
    const c = await makeCandidate({ complete: true });
    const draft = await makeJob({ status: "DRAFT", publishedAt: null });
    const expired = await makeJob({ deadline: new Date(Date.now() - DAY) });
    const closed = await makeJob({ status: "CLOSED" });
    for (const j of [draft, expired, closed]) await expect(applyToJob(c, j.id, {})).rejects.toMatchObject({ code: "VALIDATION" });
    await updateSettings(await makeAdmin(), { applicationsOpen: "", publicJobPreview: "on", requireCvForProfile: "on" });
    await expect(applyToJob(c, (await makeJob()).id, {})).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("admins cannot apply for jobs", async () => {
    const admin = await makeAdmin();
    await expect(applyToJob(admin, (await makeJob()).id, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("candidates see only their own applications (IDOR protection)", async () => {
    const alice = await makeCandidate({ complete: true, name: "Alice Example" });
    const bob = await makeCandidate({ complete: true, name: "Bob Example" });
    const job = await makeJob();
    const { applicationId } = await applyToJob(alice, job.id, {});
    await expect(getMyApplication(bob, applicationId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(withdrawApplication(bob, applicationId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listMyApplications(bob)).total).toBe(0);
    expect((await listMyApplications(alice)).total).toBe(1);
    await expect(getApplicationForAdmin(bob, applicationId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("status changes: admin only, recorded in history, candidate notified; withdrawal is final", async () => {
    const c = await makeCandidate({ complete: true });
    const admin = await makeAdmin();
    const { applicationId } = await applyToJob(c, (await makeJob()).id, {});
    await expect(updateApplicationStatus(c, applicationId, { status: "SUCCESSFUL" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { emailed } = await updateApplicationStatus(admin, applicationId, { status: "SHORTLISTED" });
    expect(emailed).toBe(true);
    const mine = await getMyApplication(c, applicationId);
    expect(mine.events.map((e) => e.toStatus)).toEqual(["SUBMITTED", "SHORTLISTED"]);
    await expect(updateApplicationStatus(admin, applicationId, { status: "WITHDRAWN" })).rejects.toMatchObject({ code: "VALIDATION" });
    await withdrawApplication(c, applicationId);
    await expect(updateApplicationStatus(admin, applicationId, { status: "INTERVIEW" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(withdrawApplication(c, applicationId)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("candidates can't change site settings", async () => {
    const c = await makeCandidate();
    await expect(updateSettings(c, { applicationsOpen: "" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
