import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { testOutbox } from "@/server/email/mailer";
import type { Actor } from "@/server/auth/policies";

/** Empties every table between tests (fast, keeps the schema). */
export async function resetDb() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  testOutbox().length = 0;
}

let seq = 0;
export const uniqueEmail = (prefix = "user") => `${prefix}${++seq}-${Date.now()}@example.test`;

export async function makeCategory(name = "Accounting & Finance") {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return db.jobCategory.upsert({ where: { slug }, update: {}, create: { name, slug } });
}

export async function makeAdmin(): Promise<Actor & { email: string }> {
  const u = await db.user.create({
    data: { email: uniqueEmail("admin"), name: "Test Admin", role: "ADMIN", passwordHash: await hashPassword("Admin-Password-123") },
  });
  return { id: u.id, role: u.role, email: u.email };
}

export async function makeCandidate(opts: { complete?: boolean; name?: string } = {}): Promise<Actor & { email: string }> {
  const u = await db.user.create({
    data: {
      email: uniqueEmail("cand"),
      name: opts.name ?? "Ada Candidate",
      role: "CANDIDATE",
      passwordHash: await hashPassword("Candidate-Pass-123"),
      profile: { create: {} },
    },
  });
  if (opts.complete) {
    const { saveProfile, uploadCv } = await import("@/server/services/profile-service");
    await saveProfile(u.id, completeProfileForm(opts.name ?? "Ada Candidate"), "core");
    await uploadCv(u.id, { name: "cv.pdf", bytes: samplePdf() });
  }
  return { id: u.id, role: u.role, email: u.email };
}

export function completeProfileForm(name = "Ada Candidate"): Record<string, string> {
  return {
    name,
    phone: "0803 123 4567",
    state: "Ogun",
    city: "Abeokuta",
    headline: "Accounting graduate seeking a finance role",
    highestQualification: "HND",
    skills: "Bookkeeping, Microsoft Excel",
  };
}

export function samplePdf(extra = ""): Buffer {
  return Buffer.from(`%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n${extra}\ntrailer << >>\n%%EOF`, "latin1");
}

/** Minimal byte layout that passes the DOCX container checks. */
export function sampleDocx(extraEntry = ""): Buffer {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from(`....[Content_Types].xml....word/document.xml....${extraEntry}`, "latin1"),
  ]);
}

export async function makeJob(overrides: Partial<Parameters<typeof db.job.create>[0]["data"]> = {}) {
  const cat = await makeCategory();
  return db.job.create({
    data: {
      slug: `job-${++seq}-${Date.now()}`,
      title: "Accounts Officer",
      summary: "Keep accurate financial records for a growing business.",
      description: "A description that is long enough to be valid for the job schema in tests.",
      responsibilities: ["Record transactions"],
      requirements: ["Two years' experience"],
      qualifications: [],
      skills: ["Excel"],
      employmentType: "FULL_TIME",
      workArrangement: "ONSITE",
      state: "Ogun",
      city: "Abeokuta",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 86_400_000),
      categoryId: cat.id,
      ...overrides,
    } as Parameters<typeof db.job.create>[0]["data"],
  });
}

export const IP = "203.0.113.10";
