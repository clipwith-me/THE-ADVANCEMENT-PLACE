import { describe, expect, it } from "vitest";
import { evaluateProfileCompleteness } from "@/lib/domain/profile-completeness";
import { endOfLagosDay, publicJobState } from "@/lib/domain/job-visibility";
import { safeNextPath } from "@/lib/domain/redirect";
import { formatSalary } from "@/lib/domain/format";
import { jobSlug, skillKey, slugify } from "@/lib/domain/slug";
import { whatsappUrl, BUSINESS } from "@/lib/business";
import { canDownloadFile, canManageJobs, canViewApplication } from "@/server/auth/policies";
import { escapeHtml } from "@/server/email/templates";

const full = {
  name: "Ada",
  email: "ada@example.test",
  phone: "+2348031234567",
  state: "Ogun",
  headline: "Graduate",
  highestQualification: "HND",
  skillCount: 2,
  hasCv: true,
  hasPhoto: true,
};
const policy = { requireCv: true, requirePhoto: true };

describe("profile completeness", () => {
  it("is complete when every required field is present — NYSC is not required", () => {
    const r = evaluateProfileCompleteness(full, policy);
    expect(r.complete).toBe(true);
    expect(r.percent).toBe(100);
  });

  it("lists exactly what is missing", () => {
    const r = evaluateProfileCompleteness({ ...full, phone: " ", skillCount: 0, hasCv: false }, policy);
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["phone", "skills", "cv"]);
  });

  it("respects the CV policy toggle", () => {
    expect(evaluateProfileCompleteness({ ...full, hasCv: false }, { ...policy, requireCv: false }).complete).toBe(true);
    expect(evaluateProfileCompleteness({ ...full, hasCv: false }, policy).complete).toBe(false);
  });

  it("requires a passport photo unless the policy turns it off", () => {
    const r = evaluateProfileCompleteness({ ...full, hasPhoto: false }, policy);
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["photo"]);
    expect(evaluateProfileCompleteness({ ...full, hasPhoto: false }, { ...policy, requirePhoto: false }).complete).toBe(true);
    expect(evaluateProfileCompleteness(full, { ...policy, requirePhoto: false }).checked).not.toContain("photo");
  });

  it("accepts any qualification, not only a bachelor's degree", () => {
    for (const q of ["OND", "HND", "SSCE", "OTHER"]) {
      expect(evaluateProfileCompleteness({ ...full, highestQualification: q }, policy).complete).toBe(true);
    }
  });
});

describe("job visibility", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const published = new Date("2026-10-01T00:00:00Z");
  it("live only when published with no passed deadline", () => {
    expect(publicJobState({ status: "PUBLISHED", publishedAt: published, deadline: null }, now)).toBe("LIVE");
    expect(publicJobState({ status: "PUBLISHED", publishedAt: published, deadline: new Date("2026-10-20") }, now)).toBe("LIVE");
  });
  it("expired jobs are never live", () => {
    expect(publicJobState({ status: "PUBLISHED", publishedAt: published, deadline: new Date("2026-10-14") }, now)).toBe("EXPIRED");
  });
  it("drafts and archived jobs are hidden; closed keep a closed page", () => {
    expect(publicJobState({ status: "DRAFT", publishedAt: null, deadline: null }, now)).toBe("HIDDEN");
    expect(publicJobState({ status: "ARCHIVED", publishedAt: published, deadline: null }, now)).toBe("HIDDEN");
    expect(publicJobState({ status: "CLOSED", publishedAt: published, deadline: null }, now)).toBe("CLOSED");
  });
  it("deadline dates run to the end of the day in Lagos", () => {
    expect(endOfLagosDay("2026-11-30").toISOString()).toBe("2026-11-30T22:59:59.999Z");
  });
});

describe("safeNextPath (open-redirect protection)", () => {
  it.each([
    ["https://evil.example", "/account"],
    ["//evil.example/x", "/account"],
    ["/\\evil.example", "/account"],
    ["javascript:alert(1)", "/account"],
    ["/jobs\u0000", "/account"],
    ["", "/account"],
  ])("rejects %j", (input, expected) => expect(safeNextPath(input)).toBe(expected));

  it("keeps same-site paths with query strings", () => {
    expect(safeNextPath("/jobs?type=FULL_TIME&q=sales")).toBe("/jobs?type=FULL_TIME&q=sales");
  });
});

describe("formatting and slugs", () => {
  it("formats naira salaries", () => {
    expect(formatSalary(150000, 220000, "MONTH")).toMatch(/₦150,000 – ₦220,000 \/ month/);
    expect(formatSalary(null, null, null)).toBeNull();
    expect(formatSalary(50000, null, "MONTH")).toMatch(/^From ₦50,000/);
  });
  it("creates descriptive, unique job slugs", () => {
    const a = jobSlug("Accounts Officer", "Abeokuta");
    expect(a).toMatch(/^accounts-officer-abeokuta-[0-9a-f]{6}$/);
    expect(jobSlug("Accounts Officer", "Abeokuta")).not.toBe(a);
    expect(slugify("  Héllo  Wörld! ")).toBe("hello-world");
    expect(skillKey("  MS   Excel ")).toBe("ms excel");
  });
  it("builds the WhatsApp link in international format", () => {
    expect(whatsappUrl()).toBe("https://wa.me/2349169975272");
    expect(BUSINESS.email).toBe("advancementplace@gmail.com");
  });
  it("escapes HTML in email templates", () => {
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;");
  });
});

describe("authorisation policies", () => {
  const admin = { id: "a1", role: "ADMIN" as const };
  const alice = { id: "c1", role: "CANDIDATE" as const };
  const bob = { id: "c2", role: "CANDIDATE" as const };

  it("only admins manage jobs", () => {
    expect(canManageJobs(admin)).toBe(true);
    expect(canManageJobs(alice)).toBe(false);
    expect(canManageJobs(null)).toBe(false);
  });
  it("candidates see only their own applications", () => {
    expect(canViewApplication(alice, { candidateId: "c1" })).toBe(true);
    expect(canViewApplication(bob, { candidateId: "c1" })).toBe(false);
    expect(canViewApplication(admin, { candidateId: "c1" })).toBe(true);
    expect(canViewApplication(null, { candidateId: "c1" })).toBe(false);
  });
  it("private files: owner or admin only; ownerless files admin only", () => {
    expect(canDownloadFile(alice, { ownerId: "c1" })).toBe(true);
    expect(canDownloadFile(bob, { ownerId: "c1" })).toBe(false);
    expect(canDownloadFile(admin, { ownerId: "c1" })).toBe(true);
    expect(canDownloadFile(alice, { ownerId: null })).toBe(false);
    expect(canDownloadFile(admin, { ownerId: null })).toBe(true);
    expect(canDownloadFile(null, { ownerId: "c1" })).toBe(false);
  });
});

describe("reviewer display name", () => {
  it("shows first name and last initial only", async () => {
    const { reviewerDisplayName } = await import("@/lib/domain/review");
    expect(reviewerDisplayName("Ngozi Eze")).toBe("Ngozi E.");
    expect(reviewerDisplayName("  Tunde   Ade  Bakare ")).toBe("Tunde B.");
    expect(reviewerDisplayName("Bola")).toBe("Bola");
    expect(reviewerDisplayName("ngozi eze")).toBe("ngozi E.");
    expect(reviewerDisplayName("   ")).toBe("Anonymous");
  });
});
