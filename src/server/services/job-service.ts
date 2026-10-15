import type { Prisma } from "@/generated/prisma/client";
import type { JobStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { forbidden, notFound, validationError } from "@/lib/errors";
import { endOfLagosDay, liveJobWhere, publicJobState, type PublicJobState } from "@/lib/domain/job-visibility";
import { jobSlug } from "@/lib/domain/slug";
import { parseOrThrow } from "@/lib/validation/parse";
import { jobSchema, type JobSearch } from "@/lib/validation/job";
import { audit } from "../audit";
import { canManageJobs, type Actor } from "../auth/policies";

export const PAGE_SIZE = 10;

// Fields safe for public pages. Internal fields (createdById, timestamps of
// internal edits) are deliberately excluded.
export const publicJobSelect = {
  id: true,
  slug: true,
  title: true,
  employerName: true,
  showEmployer: true,
  summary: true,
  description: true,
  responsibilities: true,
  requirements: true,
  qualifications: true,
  skills: true,
  employmentType: true,
  workArrangement: true,
  state: true,
  city: true,
  salaryMin: true,
  salaryMax: true,
  salaryPeriod: true,
  experienceYearsMin: true,
  experienceYearsMax: true,
  deadline: true,
  applyInstructions: true,
  status: true,
  featured: true,
  isDemo: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.JobSelect;

export type PublicJob = Prisma.JobGetPayload<{ select: typeof publicJobSelect }>;
export type JobCard = Pick<
  PublicJob,
  | "id"
  | "slug"
  | "title"
  | "employerName"
  | "showEmployer"
  | "summary"
  | "employmentType"
  | "workArrangement"
  | "state"
  | "city"
  | "salaryMin"
  | "salaryMax"
  | "salaryPeriod"
  | "deadline"
  | "featured"
  | "isDemo"
  | "publishedAt"
  | "category"
>;

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  employerName: true,
  showEmployer: true,
  summary: true,
  employmentType: true,
  workArrangement: true,
  state: true,
  city: true,
  salaryMin: true,
  salaryMax: true,
  salaryPeriod: true,
  deadline: true,
  featured: true,
  isDemo: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.JobSelect;

// ─── Public queries ──────────────────────────────────────────────────────────

export function buildSearchWhere(search: JobSearch, now = new Date()): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [liveJobWhere(now)];
  if (search.q) {
    const q = search.q;
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { skills: { has: q } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { AND: [{ showEmployer: true }, { employerName: { contains: q, mode: "insensitive" } }] },
      ],
    });
  }
  if (search.location) {
    const loc = search.location;
    and.push({
      OR: [
        { state: { contains: loc, mode: "insensitive" } },
        { city: { contains: loc, mode: "insensitive" } },
        ...(/remote/i.test(loc) ? [{ workArrangement: "REMOTE" as const }] : []),
      ],
    });
  }
  if (search.type.length) and.push({ employmentType: { in: search.type } });
  if (search.arrangement.length) and.push({ workArrangement: { in: search.arrangement } });
  if (search.category) and.push({ category: { slug: search.category } });
  return { AND: and };
}

function orderFor(sort: JobSearch["sort"]): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "deadline":
      return [{ deadline: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }];
    case "salary":
      return [{ salaryMax: { sort: "desc", nulls: "last" } }, { salaryMin: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    default:
      return [{ publishedAt: "desc" }, { id: "asc" }];
  }
}

export async function searchJobs(search: JobSearch) {
  const where = buildSearchWhere(search);
  const total = await db.job.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(search.page, pageCount);
  const items = await db.job.findMany({
    where,
    select: cardSelect,
    orderBy: orderFor(search.sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return { items, total, page, pageCount };
}

export async function latestJobs(limit = 6): Promise<JobCard[]> {
  return db.job.findMany({
    where: liveJobWhere(),
    select: cardSelect,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

export async function liveJobCount(): Promise<number> {
  return db.job.count({ where: liveJobWhere() });
}

export async function categoriesWithCounts() {
  const [categories, grouped] = await Promise.all([
    db.jobCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.job.groupBy({ by: ["categoryId"], where: liveJobWhere(), _count: { _all: true } }),
  ]);
  const counts = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
  return categories.map((c) => ({ ...c, liveCount: counts.get(c.id) ?? 0 }));
}

/** Public job page: live, expired or closed jobs resolve; drafts/archived don't. */
export async function getPublicJob(slug: string): Promise<{ job: PublicJob; state: PublicJobState } | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const job = await db.job.findUnique({ where: { slug }, select: publicJobSelect });
  if (!job) return null;
  const state = publicJobState(job);
  if (state === "HIDDEN") return null;
  return { job, state };
}

export async function relatedJobs(job: Pick<PublicJob, "id" | "category">, limit = 3): Promise<JobCard[]> {
  return db.job.findMany({
    where: { AND: [liveJobWhere(), { id: { not: job.id } }, { categoryId: job.category.id }] },
    select: cardSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function sitemapJobs() {
  return db.job.findMany({ where: liveJobWhere(), select: { slug: true, updatedAt: true, isDemo: true }, orderBy: { publishedAt: "desc" }, take: 5000 });
}

// ─── Administration ──────────────────────────────────────────────────────────

function assertCanManage(actor: Actor) {
  if (!canManageJobs(actor)) throw forbidden();
}

export async function listJobsForAdmin(actor: Actor, opts: { q?: string; status?: JobStatus; page: number }) {
  assertCanManage(actor);
  const where: Prisma.JobWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
  };
  const pageSize = 20;
  const [total, items] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        state: true,
        city: true,
        deadline: true,
        publishedAt: true,
        updatedAt: true,
        isDemo: true,
        featured: true,
        employmentType: true,
        category: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    }),
  ]);
  return { items, total, page: opts.page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getJobForAdmin(actor: Actor, id: string) {
  assertCanManage(actor);
  const job = await db.job.findUnique({
    where: { id },
    include: { category: true, _count: { select: { applications: true } } },
  });
  if (!job) throw notFound("That job doesn't exist.");
  return job;
}

export type SaveIntent = "draft" | "publish";

function toJobData(input: ReturnType<typeof jobSchema.parse>) {
  return {
    title: input.title,
    employerName: input.employerName ?? null,
    showEmployer: input.showEmployer,
    summary: input.summary,
    description: input.description,
    responsibilities: input.responsibilities,
    requirements: input.requirements,
    qualifications: input.qualifications,
    skills: input.skills,
    employmentType: input.employmentType,
    workArrangement: input.workArrangement,
    state: input.state,
    city: input.city ?? null,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    salaryPeriod: input.salaryMin != null || input.salaryMax != null ? (input.salaryPeriod ?? null) : null,
    experienceYearsMin: input.experienceYearsMin ?? null,
    experienceYearsMax: input.experienceYearsMax ?? null,
    deadline: input.deadline ? endOfLagosDay(input.deadline) : null,
    applyInstructions: input.applyInstructions ?? null,
    featured: input.featured,
    categoryId: input.categoryId,
  };
}

function assertPublishable(deadline: Date | null) {
  if (deadline && deadline.getTime() < Date.now()) {
    throw validationError("A job can't be published with a deadline in the past.", {
      deadline: ["Choose today or a future date, or leave it empty"],
    });
  }
}

async function assertCategory(categoryId: string) {
  const exists = await db.jobCategory.count({ where: { id: categoryId } });
  if (!exists) throw validationError("Please fix the highlighted fields.", { categoryId: ["Select a category"] });
}

export async function createJob(actor: Actor, raw: Record<string, string>, intent: SaveIntent) {
  assertCanManage(actor);
  const input = parseOrThrow(jobSchema, raw);
  await assertCategory(input.categoryId);
  const data = toJobData(input);
  if (intent === "publish") assertPublishable(data.deadline);
  return db.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        ...data,
        slug: jobSlug(input.title, input.city ?? input.state),
        status: intent === "publish" ? "PUBLISHED" : "DRAFT",
        publishedAt: intent === "publish" ? new Date() : null,
        createdById: actor.id,
      },
    });
    await audit({ actorId: actor.id, action: intent === "publish" ? "job.create_publish" : "job.create_draft", entityType: "Job", entityId: job.id }, tx);
    return job;
  });
}

export async function updateJob(actor: Actor, id: string, raw: Record<string, string>, intent: SaveIntent | "save") {
  assertCanManage(actor);
  const existing = await getJobForAdmin(actor, id);
  const input = parseOrThrow(jobSchema, raw);
  await assertCategory(input.categoryId);
  const data = toJobData(input);
  const willBePublished = intent === "publish" || (intent === "save" && existing.status === "PUBLISHED");
  if (willBePublished) assertPublishable(data.deadline);
  return db.$transaction(async (tx) => {
    const job = await tx.job.update({
      where: { id },
      data: {
        ...data,
        ...(intent === "publish" ? { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date(), closedAt: null } : {}),
        ...(intent === "draft" ? { status: "DRAFT" } : {}),
      },
    });
    await audit({ actorId: actor.id, action: `job.update_${intent}`, entityType: "Job", entityId: id }, tx);
    return job;
  });
}

export type JobTransition = "publish" | "unpublish" | "close" | "archive" | "reopen";

const TRANSITIONS: Record<JobTransition, { from: JobStatus[]; to: JobStatus }> = {
  publish: { from: ["DRAFT"], to: "PUBLISHED" },
  unpublish: { from: ["PUBLISHED"], to: "DRAFT" },
  close: { from: ["PUBLISHED"], to: "CLOSED" },
  archive: { from: ["DRAFT", "PUBLISHED", "CLOSED"], to: "ARCHIVED" },
  reopen: { from: ["CLOSED", "ARCHIVED"], to: "DRAFT" },
};

export async function transitionJob(actor: Actor, id: string, action: JobTransition) {
  assertCanManage(actor);
  const rule = TRANSITIONS[action];
  if (!rule) throw validationError("Unknown action.");
  const job = await getJobForAdmin(actor, id);
  if (!rule.from.includes(job.status)) {
    throw validationError(`A ${job.status.toLowerCase()} job can't be ${action === "reopen" ? "reopened" : `${action}ed`}.`);
  }
  if (action === "publish") assertPublishable(job.deadline);
  return db.$transaction(async (tx) => {
    const updated = await tx.job.update({
      where: { id },
      data: {
        status: rule.to,
        ...(action === "publish" ? { publishedAt: job.publishedAt ?? new Date(), closedAt: null } : {}),
        ...(action === "close" ? { closedAt: new Date() } : {}),
      },
    });
    await audit({ actorId: actor.id, action: `job.${action}`, entityType: "Job", entityId: id, metadata: { from: job.status, to: rule.to } }, tx);
    return updated;
  });
}

export async function listCategories() {
  return db.jobCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
