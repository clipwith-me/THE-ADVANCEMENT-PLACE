import type { Prisma } from "@/generated/prisma/client";
import type { ReviewStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { forbidden, notFound } from "@/lib/errors";
import { REVIEWER_TYPE_LABEL } from "@/lib/domain/labels";
import { reviewerDisplayName } from "@/lib/domain/review";
import { parseOrThrow } from "@/lib/validation/parse";
import { reviewSchema } from "@/lib/validation/review";
import { audit } from "../audit";
import { canModerateReviews, type Actor } from "../auth/policies";
import { sendEmail } from "../email/mailer";
import { reviewNotificationEmail } from "../email/templates";
import { enforce, LIMITS } from "../rate-limit";

/**
 * Stores a public review as PENDING. Nothing reaches the website until an
 * administrator approves it; staff are emailed so reviews don't sit unseen.
 */
export async function submitReview(raw: Record<string, string>, ip: string): Promise<{ id: string; notified: boolean }> {
  const input = parseOrThrow(reviewSchema, raw);
  await enforce(LIMITS.review, ip);
  const review = await db.review.create({
    data: { name: input.name, email: input.email, reviewerType: input.reviewerType, rating: input.rating, comment: input.comment },
  });
  const result = await sendEmail(
    reviewNotificationEmail(
      env().NOTIFY_EMAIL,
      [
        ["Name", input.name],
        ["Email", input.email],
        ["Reviewer", REVIEWER_TYPE_LABEL[input.reviewerType]],
        ["Rating", `${input.rating} out of 5`],
        ["Review", input.comment],
      ],
      `${env().APP_URL}/admin/reviews`,
    ),
  );
  if (result.delivered) await db.review.update({ where: { id: review.id }, data: { notifiedAt: new Date() } });
  return { id: review.id, notified: result.delivered };
}

// ─── Public ──────────────────────────────────────────────────────────────────

export interface PublicReview {
  id: string;
  displayName: string;
  reviewerType: keyof typeof REVIEWER_TYPE_LABEL;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Email and full name are never selected for public pages.
const publicSelect = { id: true, name: true, reviewerType: true, rating: true, comment: true, createdAt: true } satisfies Prisma.ReviewSelect;

function toPublic(r: Prisma.ReviewGetPayload<{ select: typeof publicSelect }>): PublicReview {
  return { id: r.id, displayName: reviewerDisplayName(r.name), reviewerType: r.reviewerType, rating: r.rating, comment: r.comment, createdAt: r.createdAt };
}

export async function latestApprovedReviews(limit = 3): Promise<PublicReview[]> {
  const rows = await db.review.findMany({ where: { status: "APPROVED" }, orderBy: { moderatedAt: "desc" }, take: limit, select: publicSelect });
  return rows.map(toPublic);
}

export async function listApprovedReviews(page = 1, pageSize = 12) {
  const where = { status: "APPROVED" as const };
  const [total, rows] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({ where, orderBy: { moderatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: publicSelect }),
  ]);
  return { items: rows.map(toPublic), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// ─── Moderation ──────────────────────────────────────────────────────────────

function assertModerator(actor: Actor) {
  if (!canModerateReviews(actor)) throw forbidden();
}

export async function listReviewsForAdmin(actor: Actor, opts: { status: ReviewStatus; page: number }) {
  assertModerator(actor);
  const pageSize = 20;
  const where = { status: opts.status };
  const [total, items, counts] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({ where, orderBy: { createdAt: "desc" }, skip: (opts.page - 1) * pageSize, take: pageSize }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<ReviewStatus, number>>;
  return { items, total, page: opts.page, pageCount: Math.max(1, Math.ceil(total / pageSize)), byStatus };
}

export type ReviewDecision = "approve" | "reject" | "delete";

/** Approve (publish), reject (hide) or permanently delete (spam). Always audited. */
export async function moderateReview(actor: Actor, id: string, decision: ReviewDecision) {
  assertModerator(actor);
  const review = await db.review.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!review) throw notFound("That review doesn't exist.");
  await db.$transaction(async (tx) => {
    if (decision === "delete") {
      await tx.review.delete({ where: { id } });
    } else {
      await tx.review.update({
        where: { id },
        data: { status: decision === "approve" ? "APPROVED" : "REJECTED", moderatedAt: new Date(), moderatedById: actor.id },
      });
    }
    await audit({ actorId: actor.id, action: `review.${decision}`, entityType: "Review", entityId: id, metadata: { from: review.status } }, tx);
  });
}

export async function pendingReviewCount(actor: Actor): Promise<number> {
  assertModerator(actor);
  return db.review.count({ where: { status: "PENDING" } });
}
