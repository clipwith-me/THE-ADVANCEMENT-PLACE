import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { EnquiryStatus, EnquiryType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { forbidden, notFound } from "@/lib/errors";
import { ENQUIRY_STATUSES, ENQUIRY_TYPE_LABEL, ENQUIRY_TYPE_SLUG, QUALIFICATION_LABEL } from "@/lib/domain/labels";
import { optionalText } from "@/lib/validation/common";
import { careerAssistanceSchema, contactSchema, outsourcingSchema } from "@/lib/validation/enquiry";
import { parseOrThrow } from "@/lib/validation/parse";
import { audit } from "../audit";
import { canManageEnquiries, type Actor } from "../auth/policies";
import { sendEmail } from "../email/mailer";
import { enquiryNotificationEmail } from "../email/templates";
import { enforce, LIMITS } from "../rate-limit";
import { storeDocument, type IncomingFile } from "./file-service";

export interface SubmitResult {
  id: string;
  notified: boolean;
}

/**
 * Persist first, then notify. If the notification email fails the enquiry is
 * still stored (and visible in the admin dashboard), so nothing is lost.
 */
async function persistAndNotify(
  type: EnquiryType,
  data: Omit<Prisma.EnquiryUncheckedCreateInput, "type" | "attachmentId">,
  attachment: IncomingFile | null,
  summary: [string, string | undefined | null][],
): Promise<SubmitResult> {
  const enquiry = await db.$transaction(async (tx) => {
    const file = attachment ? await storeDocument(tx, { kind: "ENQUIRY_ATTACHMENT", ownerId: null, file: attachment }) : null;
    return tx.enquiry.create({ data: { ...data, type, attachmentId: file?.id ?? null } });
  });

  const result = await sendEmail(
    enquiryNotificationEmail(
      env().NOTIFY_EMAIL,
      ENQUIRY_TYPE_LABEL[type].toLowerCase(),
      [...summary, ["Attachment", attachment ? "Yes — download it from the dashboard" : null]],
      `${env().APP_URL}/admin/enquiries/${ENQUIRY_TYPE_SLUG[type]}/${enquiry.id}`,
      data.email,
    ),
  );
  if (result.delivered) await db.enquiry.update({ where: { id: enquiry.id }, data: { notifiedAt: new Date() } });
  return { id: enquiry.id, notified: result.delivered };
}

export async function submitContact(raw: Record<string, string>, ip: string) {
  const input = parseOrThrow(contactSchema, raw);
  await enforce(LIMITS.publicForm, ip);
  return persistAndNotify(
    "CONTACT",
    { name: input.name, email: input.email, phone: input.phone ?? null, subject: input.subject, message: input.message },
    null,
    [["Name", input.name], ["Email", input.email], ["Phone", input.phone], ["Subject", input.subject], ["Message", input.message]],
  );
}

export async function submitCareerAssistance(raw: Record<string, string>, attachment: IncomingFile | null, ip: string) {
  const input = parseOrThrow(careerAssistanceSchema, raw);
  await enforce(LIMITS.publicForm, ip);
  return persistAndNotify(
    "CAREER_ASSISTANCE",
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      qualification: input.qualification,
      subject: input.courseOfStudy ?? null,
      careerInterests: input.careerInterests,
      message: input.message,
    },
    attachment,
    [
      ["Name", input.name],
      ["Email", input.email],
      ["Phone", input.phone],
      ["Qualification", QUALIFICATION_LABEL[input.qualification]],
      ["Course of study", input.courseOfStudy],
      ["Career interests", input.careerInterests],
      ["Message", input.message],
    ],
  );
}

export async function submitOutsourcing(raw: Record<string, string>, attachment: IncomingFile | null, ip: string) {
  const input = parseOrThrow(outsourcingSchema, raw);
  await enforce(LIMITS.publicForm, ip);
  return persistAndNotify(
    "FREELANCE_OUTSOURCING",
    {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      organization: input.organization ?? null,
      subject: input.serviceType,
      message: input.message,
    },
    attachment,
    [
      ["Name", input.name],
      ["Email", input.email],
      ["Phone", input.phone],
      ["Organisation", input.organization],
      ["Service", input.serviceType],
      ["Project description", input.message],
    ],
  );
}

// ─── Administration ──────────────────────────────────────────────────────────

function assertManager(actor: Actor) {
  if (!canManageEnquiries(actor)) throw forbidden();
}

export async function listEnquiries(actor: Actor, type: EnquiryType, opts: { status?: EnquiryStatus; q?: string; page: number }) {
  assertManager(actor);
  const where: Prisma.EnquiryWhereInput = {
    type,
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q
      ? {
          OR: [
            { name: { contains: opts.q, mode: "insensitive" } },
            { email: { contains: opts.q, mode: "insensitive" } },
            { subject: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const pageSize = 20;
  const [total, items] = await Promise.all([
    db.enquiry.count({ where }),
    db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      select: { id: true, name: true, email: true, subject: true, status: true, createdAt: true, attachmentId: true, organization: true },
    }),
  ]);
  return { items, total, page: opts.page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getEnquiry(actor: Actor, type: EnquiryType, id: string) {
  assertManager(actor);
  const enquiry = await db.enquiry.findFirst({
    where: { id, type },
    include: { attachment: { select: { id: true, originalName: true, sizeBytes: true } } },
  });
  if (!enquiry) throw notFound("That enquiry doesn't exist.");
  return enquiry;
}

const updateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES, { error: "Select a valid status" }),
  adminNotes: optionalText(4000),
});

export async function updateEnquiry(actor: Actor, id: string, raw: Record<string, string>) {
  assertManager(actor);
  const input = parseOrThrow(updateSchema, raw);
  const exists = await db.enquiry.count({ where: { id } });
  if (!exists) throw notFound();
  await db.$transaction(async (tx) => {
    await tx.enquiry.update({ where: { id }, data: { status: input.status, adminNotes: input.adminNotes ?? null } });
    await audit({ actorId: actor.id, action: "enquiry.update", entityType: "Enquiry", entityId: id, metadata: { status: input.status } }, tx);
  });
}

export async function enquiryCounts(actor: Actor) {
  assertManager(actor);
  const grouped = await db.enquiry.groupBy({ by: ["type"], where: { status: "NEW" }, _count: { _all: true } });
  return Object.fromEntries(grouped.map((g) => [g.type, g._count._all])) as Partial<Record<EnquiryType, number>>;
}
