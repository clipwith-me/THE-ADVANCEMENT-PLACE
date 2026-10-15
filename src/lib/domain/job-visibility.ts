import type { JobStatusValue } from "./labels";

/**
 * A vacancy is "live" — listed, indexable and open to applications — only when
 * it is published and its deadline (if any) hasn't passed. Drafts, closed,
 * archived and expired jobs never appear as active vacancies.
 */
export interface VisibilityInput {
  status: JobStatusValue;
  deadline: Date | null;
  publishedAt: Date | null;
}

export type PublicJobState = "LIVE" | "EXPIRED" | "CLOSED" | "HIDDEN";

export function publicJobState(job: VisibilityInput, now = new Date()): PublicJobState {
  if (job.status === "PUBLISHED" && job.publishedAt) {
    if (job.deadline && job.deadline.getTime() < now.getTime()) return "EXPIRED";
    return "LIVE";
  }
  // A closed job that was once public keeps a "no longer accepting" page so
  // shared links don't break; drafts/archived are simply not found.
  if (job.status === "CLOSED" && job.publishedAt) return "CLOSED";
  return "HIDDEN";
}

export const isLive = (job: VisibilityInput, now = new Date()) => publicJobState(job, now) === "LIVE";

/** Prisma `where` fragment for live jobs; keep in sync with publicJobState. */
export function liveJobWhere(now = new Date()) {
  return {
    status: "PUBLISHED" as const,
    publishedAt: { not: null, lte: now },
    OR: [{ deadline: null }, { deadline: { gte: now } }],
  };
}

/** Deadlines are entered as calendar dates; accept applications through the end of that day in Lagos (UTC+1). */
export function endOfLagosDay(dateOnly: string): Date {
  // "2026-11-30" → 2026-11-30T23:59:59.999+01:00
  return new Date(`${dateOnly}T23:59:59.999+01:00`);
}

export function daysUntil(deadline: Date, now = new Date()): number {
  return Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
}
