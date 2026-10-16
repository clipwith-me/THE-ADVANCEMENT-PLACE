import { describe, expect, it } from "vitest";
import { validateDocument, sanitizeFilename } from "@/server/storage/file-validation";
import { coreProfileSchema, fullProfileSchema } from "@/lib/validation/profile";
import { jobSchema, parseJobSearch } from "@/lib/validation/job";
import { registerSchema } from "@/lib/validation/auth";
import { contactSchema } from "@/lib/validation/enquiry";
import { samplePdf, sampleDocx } from "../helpers";

const MB = 1024 * 1024;

describe("document validation", () => {
  it("accepts real PDF and DOCX content", () => {
    expect(validateDocument(samplePdf(), "My CV.pdf", 5 * MB)).toMatchObject({ ok: true, ext: "pdf", mimeType: "application/pdf" });
    expect(validateDocument(sampleDocx(), "cv.DOCX", 5 * MB)).toMatchObject({ ok: true, ext: "docx" });
  });
  it("rejects files whose content doesn't match the extension", () => {
    const exe = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(100)]);
    expect(validateDocument(exe, "cv.pdf", 5 * MB).ok).toBe(false);
    expect(validateDocument(samplePdf(), "cv.docx", 5 * MB).ok).toBe(false);
  });
  it("rejects disallowed extensions, empty and oversized files", () => {
    expect(validateDocument(samplePdf(), "cv.exe", 5 * MB).ok).toBe(false);
    expect(validateDocument(samplePdf(), "cv.pdf.exe", 5 * MB).ok).toBe(false);
    expect(validateDocument(samplePdf(), "cv.doc", 5 * MB).ok).toBe(false);
    expect(validateDocument(Buffer.alloc(0), "cv.pdf", 5 * MB).ok).toBe(false);
    expect(validateDocument(Buffer.concat([samplePdf(), Buffer.alloc(2 * MB)]), "cv.pdf", MB).ok).toBe(false);
  });
  it("rejects active content: PDF JavaScript and macro-enabled Word files", () => {
    expect(validateDocument(samplePdf("<< /S /JavaScript /JS (app.alert(1)) >>"), "cv.pdf", 5 * MB).ok).toBe(false);
    expect(validateDocument(samplePdf("<< /S /Launch >>"), "cv.pdf", 5 * MB).ok).toBe(false);
    expect(validateDocument(sampleDocx("word/vbaProject.bin"), "cv.docx", 5 * MB).ok).toBe(false);
  });
  it("sanitises display names (no paths or injection characters)", () => {
    expect(sanitizeFilename("../../etc/passwd.pdf", "pdf")).toBe("passwd.pdf");
    expect(sanitizeFilename('C:\\Users\\x\\"evil"<script>.pdf', "pdf")).toBe("evilscript.pdf");
    expect(sanitizeFilename("....pdf", "pdf")).toBe("document.pdf");
  });
});

describe("profile validation", () => {
  const base = {
    name: "Ada Candidate",
    phone: "0803 123 4567",
    state: "Ogun",
    headline: "Graduate",
    highestQualification: "OND",
    skills: "Excel, excel , Bookkeeping",
  };
  it("normalises Nigerian phone numbers and de-duplicates skills", () => {
    const r = coreProfileSchema.parse(base);
    expect(r.phone).toBe("+2348031234567");
    expect(r.skills).toEqual(["Excel", "Bookkeeping"]);
  });
  it("treats NYSC status as optional", () => {
    expect(coreProfileSchema.parse(base).nyscStatus).toBeNull();
    expect(coreProfileSchema.parse({ ...base, nyscStatus: "" }).nyscStatus).toBeNull();
    expect(coreProfileSchema.parse({ ...base, nyscStatus: "SERVING" }).nyscStatus).toBe("SERVING");
    expect(coreProfileSchema.safeParse({ ...base, nyscStatus: "BOGUS" }).success).toBe(false);
  });
  it("rejects unsafe or wrong-host URLs", () => {
    expect(fullProfileSchema.safeParse({ ...base, portfolioUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(fullProfileSchema.safeParse({ ...base, linkedinUrl: "https://evil.example/in/x" }).success).toBe(false);
    expect(fullProfileSchema.parse({ ...base, linkedinUrl: "linkedin.com/in/ada" }).linkedinUrl).toBe("https://linkedin.com/in/ada");
  });
  it("ignores fields that aren't in the schema (no mass assignment)", () => {
    const r = coreProfileSchema.parse({ ...base, userId: "x", completedAt: "now", role: "ADMIN" }) as Record<string, unknown>;
    expect(r.userId).toBeUndefined();
    expect(r.role).toBeUndefined();
  });
});

describe("auth & enquiry validation", () => {
  const reg = { name: "Ada", email: "ADA@Example.Test ", password: "abcdefgh12", confirmPassword: "abcdefgh12", acceptTerms: "on" };
  it("normalises email and enforces password policy", () => {
    expect(registerSchema.parse(reg).email).toBe("ada@example.test");
    expect(registerSchema.safeParse({ ...reg, password: "short1", confirmPassword: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...reg, confirmPassword: "different12" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...reg, acceptTerms: undefined }).success).toBe(false);
  });
  it("rejects bot submissions via the honeypot", () => {
    expect(registerSchema.safeParse({ ...reg, website: "http://spam" }).success).toBe(false);
    expect(
      contactSchema.safeParse({ name: "A B", email: "a@b.co", subject: "Hello", message: "Hello there!", consent: "on", website: "x" }).success,
    ).toBe(false);
  });
});

describe("job validation and search parsing", () => {
  const job = {
    title: "Accounts Officer",
    categoryId: "cat1",
    summary: "Keep accurate financial records for a growing business.",
    description: "A".repeat(60),
    responsibilities: "- Record transactions\n• Reconcile accounts",
    requirements: "Two years' experience",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    state: "Ogun",
  };
  it("parses list fields and strips bullets", () => {
    const r = jobSchema.parse(job);
    expect(r.responsibilities).toEqual(["Record transactions", "Reconcile accounts"]);
  });
  it("validates salary range, period and employer publication", () => {
    expect(jobSchema.safeParse({ ...job, salaryMin: "200000", salaryMax: "100000", salaryPeriod: "MONTH" }).success).toBe(false);
    expect(jobSchema.safeParse({ ...job, salaryMin: "100,000" }).success).toBe(false); // period required
    expect(jobSchema.parse({ ...job, salaryMin: "₦100,000", salaryPeriod: "MONTH" }).salaryMin).toBe(100000);
    expect(jobSchema.safeParse({ ...job, showEmployer: "on" }).success).toBe(false);
  });
  it("combines filters and drops invalid values instead of failing", () => {
    const s = parseJobSearch({ q: " sales ", type: ["FULL_TIME", "BOGUS", "PART_TIME"], arrangement: "REMOTE", category: "x y!", sort: "drop table", page: "-3" });
    expect(s).toMatchObject({ q: "sales", type: ["FULL_TIME", "PART_TIME"], arrangement: ["REMOTE"], category: undefined, sort: "newest", page: 1 });
  });
});

describe("readUpload", () => {
  it("treats the empty part a browser sends for an unused file input as no file", async () => {
    const { readUpload } = await import("@/server/services/file-service");
    expect(await readUpload(new File([], ""))).toBeNull();
    expect(await readUpload(new File([], "blob", { type: "application/octet-stream" }))).toBeNull();
    expect(await readUpload(null)).toBeNull();
    expect((await readUpload(new File([new Uint8Array(samplePdf())], "cv.pdf")))?.name).toBe("cv.pdf");
  });
});
