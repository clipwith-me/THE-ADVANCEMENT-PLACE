import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { conflict, forbidden, notFound, validationError } from "@/lib/errors";
import { isLive } from "@/lib/domain/job-visibility";
import {
  ADMIN_SETTABLE_STATUSES,
  APPLICATION_STATUS_LABEL,
  FINAL_APPLICATION_STATUSES,
  QUALIFICATION_LABEL,
  type QualificationValue,
} from "@/lib/domain/labels";
import { optionalText, requiredText } from "@/lib/validation/common";
import { parseOrThrow } from "@/lib/validation/parse";
import { audit } from "../audit";
import { canApplyForJobs, canReviewApplications, canViewApplication, type Actor } from "../auth/policies";
import { sendEmail, type SendResult } from "../email/mailer";
import { applicationReceivedEmail, applicationStatusEmail } from "../email/templates";
import { enforce, LIMITS } from "../rate-limit";
import { getCompleteness } from "./profile-service";
import { getSettings } from "./settings-service";

const applySchema = z.object({ coverMessage: optionalText(3000) });

/** Thrown when the gate fails so the UI can send the candidate to profile setup. */
export class ProfileIncompleteError extends Error {
  constructor(readonly missing: string[]) {
    super("Complete your profile before applying.");
    this.name = "ProfileIncompleteError";
  }
}

export interface ApplyResult {
  applicationId: string;
  confirmationEmail: SendResult;
}

/**
 * Submits an application. Server-enforced rules: candidate role, complete
 * profile, live vacancy, applications open, and one application per vacancy
 * (checked here for a friendly message, guaranteed by a unique constraint).
 */
export async function applyToJob(actor: Actor, jobId: string, raw: Record<string, string>): Promise<ApplyResult> {
  if (!canApplyForJobs(actor)) throw forbidden("Only candidate accounts can apply for jobs.");
  const input = parseOrThrow(applySchema, raw);
  await enforce(LIMITS.apply, actor.id);

  const settings = await getSettings();
  if (!settings.applicationsOpen) throw validationError("Applications are temporarily paused. Please try again later.");

  const { bundle, result } = await getCompleteness(actor.id);
  if (!result.complete) throw new ProfileIncompleteError(result.missing);
  if (env().REQUIRE_EMAIL_VERIFICATION && !bundle.emailVerifiedAt) {
    throw validationError("Please confirm your email address before applying. You can resend the link from your dashboard.");
  }

  const job = await db.job.findUnique({ where: { id: jobId }, select: { id: true, title: true, slug: true, status: true, deadline: true, publishedAt: true } });
  if (!job) throw notFound("This vacancy doesn't exist.");
  if (!isLive(job)) throw validationError("This vacancy is no longer accepting applications.");

  const existing = await db.application.findUnique({ where: { jobId_candidateId: { jobId, candidateId: actor.id } }, select: { id: true } });
  if (existing) throw conflict("You've already applied for this vacancy.");

  const p = bundle.profile!;
  const snapshot: Prisma.InputJsonValue = {
    name: bundle.name,
    email: bundle.email,
    phone: p.phone,
    state: p.state,
    city: p.city,
    headline: p.headline,
    qualification: p.highestQualification ? QUALIFICATION_LABEL[p.highestQualification as QualificationValue] : null,
    qualificationDetail: p.qualificationDetail,
    nyscStatus: p.nyscStatus,
    skills: p.skills.map((s) => s.skill.name),
    cvName: p.currentCv?.originalName ?? null,
  };

  let applicationId: string;
  try {
    applicationId = await db.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId,
          candidateId: actor.id,
          cvFileId: p.currentCvId,
          photoFileId: p.photoId,
          coverMessage: input.coverMessage ?? null,
          profileSnapshot: snapshot,
          events: { create: { toStatus: "SUBMITTED", changedById: actor.id } },
        },
      });
      await audit({ actorId: actor.id, action: "application.submit", entityType: "Application", entityId: app.id, metadata: { jobId } }, tx);
      return app.id;
    });
  } catch (e) {
    // A concurrent double-submit loses the race on the unique constraint.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      throw conflict("You've already applied for this vacancy.");
    }
    throw e;
  }

  // Email after commit: failure is reported honestly but never undoes the application.
  const confirmationEmail = await sendEmail(
    applicationReceivedEmail(bundle.email, bundle.name, job.title, `${env().APP_URL}/account/applications`),
  );
  return { applicationId, confirmationEmail };
}

// ─── Candidate views ─────────────────────────────────────────────────────────

const candidateApplicationSelect = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  coverMessage: true,
  candidateId: true,
  cvFile: { select: { id: true, originalName: true } },
  photoFile: { select: { id: true } },
  job: { select: { id: true, slug: true, title: true, state: true, city: true, status: true, deadline: true, publishedAt: true, employmentType: true, isDemo: true } },
  // Status history is shared; internal notes are deliberately not selected.
  events: { select: { toStatus: true, createdAt: true }, orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.ApplicationSelect;

export async function listMyApplications(actor: Actor, page = 1) {
  const pageSize = 10;
  const where = { candidateId: actor.id };
  const [total, items] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({ where, select: candidateApplicationSelect, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function myApplicationForJob(actor: Actor, jobId: string) {
  return db.application.findUnique({ where: { jobId_candidateId: { jobId, candidateId: actor.id } }, select: { id: true, status: true, createdAt: true } });
}

export async function getMyApplication(actor: Actor, id: string) {
  const app = await db.application.findUnique({ where: { id }, select: candidateApplicationSelect });
  // Same response for "missing" and "someone else's" — no ID probing.
  if (!app || !canViewApplication(actor, app) || app.candidateId !== actor.id) throw notFound();
  return app;
}

export async function withdrawApplication(actor: Actor, id: string) {
  const app = await getMyApplication(actor, id);
  if (FINAL_APPLICATION_STATUSES.includes(app.status)) {
    throw validationError("This application can no longer be withdrawn.");
  }
  await db.$transaction(async (tx) => {
    await tx.application.update({ where: { id }, data: { status: "WITHDRAWN" } });
    await tx.applicationStatusEvent.create({ data: { applicationId: id, fromStatus: app.status, toStatus: "WITHDRAWN", changedById: actor.id } });
    await audit({ actorId: actor.id, action: "application.withdraw", entityType: "Application", entityId: id }, tx);
  });
}

// ─── Administration ──────────────────────────────────────────────────────────

function assertReviewer(actor: Actor) {
  if (!canReviewApplications(actor)) throw forbidden();
}

export async function listApplicationsForAdmin(
  actor: Actor,
  opts: { q?: string; status?: ApplicationStatus; jobId?: string; page: number },
) {
  assertReviewer(actor);
  const where: Prisma.ApplicationWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.jobId ? { jobId: opts.jobId } : {}),
    ...(opts.q
      ? {
          OR: [
            { candidate: { name: { contains: opts.q, mode: "insensitive" } } },
            { candidate: { email: { contains: opts.q, mode: "insensitive" } } },
            { job: { title: { contains: opts.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const pageSize = 20;
  const [total, items] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        createdAt: true,
        candidate: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
        cvFile: { select: { id: true } },
        photoFile: { select: { id: true } },
      },
    }),
  ]);
  return { items, total, page: opts.page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getApplicationForAdmin(actor: Actor, id: string) {
  assertReviewer(actor);
  const app = await db.application.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, slug: true, status: true } },
      candidate: { select: { id: true, name: true, email: true, createdAt: true } },
      cvFile: { select: { id: true, originalName: true, sizeBytes: true } },
      photoFile: { select: { id: true } },
      events: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { name: true, role: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!app) throw notFound("That application doesn't exist.");
  return app;
}

const statusSchema = z.object({ status: z.enum(ADMIN_SETTABLE_STATUSES, { error: "Select a valid status" }) });

export async function updateApplicationStatus(actor: Actor, id: string, raw: Record<string, string>, notify = true) {
  assertReviewer(actor);
  const { status } = parseOrThrow(statusSchema, raw);
  const app = await db.application.findUnique({
    where: { id },
    select: { status: true, candidate: { select: { email: true, name: true } }, job: { select: { title: true } } },
  });
  if (!app) throw notFound();
  if (app.status === "WITHDRAWN") throw validationError("The candidate withdrew this application; its status can't be changed.");
  if (app.status === status) return { emailed: null };
  await db.$transaction(async (tx) => {
    await tx.application.update({ where: { id }, data: { status } });
    await tx.applicationStatusEvent.create({ data: { applicationId: id, fromStatus: app.status, toStatus: status, changedById: actor.id } });
    await audit({ actorId: actor.id, action: "application.status", entityType: "Application", entityId: id, metadata: { from: app.status, to: status } }, tx);
  });
  if (!notify || status === "SUBMITTED") return { emailed: null };
  const result = await sendEmail(
    applicationStatusEmail(app.candidate.email, app.candidate.name, app.job.title, APPLICATION_STATUS_LABEL[status], `${env().APP_URL}/account/applications/${id}`),
  );
  if (!result.delivered) logger.warn("application.status_email_not_delivered", { applicationId: id, reason: result.reason });
  return { emailed: result.delivered };
}

const noteSchema = z.object({ body: requiredText("Note", 1, 2000) });

export async function addApplicationNote(actor: Actor, id: string, raw: Record<string, string>) {
  assertReviewer(actor);
  const { body } = parseOrThrow(noteSchema, raw);
  const exists = await db.application.count({ where: { id } });
  if (!exists) throw notFound();
  await db.applicationNote.create({ data: { applicationId: id, authorId: actor.id, body } });
  await audit({ actorId: actor.id, action: "application.note", entityType: "Application", entityId: id });
}
