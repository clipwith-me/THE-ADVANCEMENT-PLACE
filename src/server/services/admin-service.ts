import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { forbidden, notFound, validationError } from "@/lib/errors";
import { liveJobWhere } from "@/lib/domain/job-visibility";
import { audit } from "../audit";
import { canViewCandidates, isAdmin, type Actor } from "../auth/policies";
import { invalidateUserSessions } from "../auth/session";

/** Dashboard figures — every number is a live database count. */
export async function dashboardMetrics(actor: Actor) {
  if (!isAdmin(actor)) throw forbidden();
  const weeks = 8;
  const since = new Date(Date.now() - weeks * 7 * 86_400_000);
  const [candidates, completeProfiles, liveJobs, draftJobs, totalApplications, needsReview, newEnquiries, recentApplications, recentApps] =
    await Promise.all([
      db.user.count({ where: { role: "CANDIDATE" } }),
      db.candidateProfile.count({ where: { completedAt: { not: null }, user: { role: "CANDIDATE" } } }),
      db.job.count({ where: liveJobWhere() }),
      db.job.count({ where: { status: "DRAFT" } }),
      db.application.count(),
      db.application.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      db.enquiry.count({ where: { status: "NEW" } }),
      db.application.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      db.application.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, status: true, createdAt: true, candidate: { select: { name: true } }, job: { select: { title: true } } },
      }),
    ]);

  // Weekly buckets, oldest first, for the activity chart.
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(since.getTime() + i * 7 * 86_400_000);
    return { start, count: 0 };
  });
  for (const a of recentApplications) {
    const idx = Math.min(weeks - 1, Math.floor((a.createdAt.getTime() - since.getTime()) / (7 * 86_400_000)));
    if (idx >= 0) buckets[idx]!.count++;
  }

  return { candidates, completeProfiles, liveJobs, draftJobs, totalApplications, needsReview, newEnquiries, weekly: buckets, recentApps };
}

export async function listCandidates(actor: Actor, opts: { q?: string; complete?: "yes" | "no"; page: number }) {
  if (!canViewCandidates(actor)) throw forbidden();
  const where: Prisma.UserWhereInput = {
    role: "CANDIDATE",
    ...(opts.q
      ? {
          OR: [
            { name: { contains: opts.q, mode: "insensitive" } },
            { email: { contains: opts.q, mode: "insensitive" } },
            { profile: { headline: { contains: opts.q, mode: "insensitive" } } },
            { profile: { skills: { some: { skill: { slug: { contains: opts.q.toLowerCase() } } } } } },
          ],
        }
      : {}),
    ...(opts.complete === "yes" ? { profile: { completedAt: { not: null } } } : {}),
    ...(opts.complete === "no" ? { OR: [{ profile: null }, { profile: { completedAt: null } }] } : {}),
  };
  const pageSize = 20;
  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      // Explicit select: password hashes and tokens are never loaded here.
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        profile: { select: { headline: true, state: true, completedAt: true, highestQualification: true } },
        _count: { select: { applications: true } },
      },
    }),
  ]);
  return { items, total, page: opts.page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCandidate(actor: Actor, id: string) {
  if (!canViewCandidates(actor)) throw forbidden();
  const user = await db.user.findFirst({
    where: { id, role: "CANDIDATE" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      lastLoginAt: true,
      profile: {
        include: {
          skills: { include: { skill: true } },
          currentCv: { select: { id: true, originalName: true, sizeBytes: true, createdAt: true } },
          education: true,
          experience: { orderBy: { startDate: "desc" } },
        },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, createdAt: true, job: { select: { title: true } } },
      },
    },
  });
  if (!user) throw notFound("That candidate doesn't exist.");
  return user;
}

/** Suspension is preferred over deletion: it's reversible and keeps history. */
export async function setCandidateStatus(actor: Actor, id: string, status: "ACTIVE" | "SUSPENDED") {
  if (!isAdmin(actor)) throw forbidden();
  const user = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!user || user.role !== "CANDIDATE") throw notFound();
  if (status !== "ACTIVE" && status !== "SUSPENDED") throw validationError("Invalid status");
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status } });
    await audit({ actorId: actor.id, action: status === "SUSPENDED" ? "candidate.suspend" : "candidate.reactivate", entityType: "User", entityId: id }, tx);
  });
  if (status === "SUSPENDED") await invalidateUserSessions(id);
}

export async function recentAudit(actor: Actor, limit = 30) {
  if (!isAdmin(actor)) throw forbidden();
  return db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { actor: { select: { name: true } } } });
}
