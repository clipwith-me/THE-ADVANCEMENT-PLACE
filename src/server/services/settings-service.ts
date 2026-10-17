import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { forbidden, validationError } from "@/lib/errors";
import { fieldErrorsOf, optionalText } from "@/lib/validation/common";
import { audit } from "../audit";
import { canManageSettings, type Actor } from "../auth/policies";

export interface Settings {
  publicJobPreview: boolean;
  requireCvForProfile: boolean;
  requirePhotoForProfile: boolean;
  applicationsOpen: boolean;
  announcement: string | null;
}

/** Memoised per request; the single row is created on first use (race-safe). */
export const getSettings = cache(async (): Promise<Settings> => {
  let row = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (!row) {
    await db.siteSettings.createMany({ data: [{ id: 1 }], skipDuplicates: true });
    row = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  }
  return {
    publicJobPreview: row.publicJobPreview,
    requireCvForProfile: row.requireCvForProfile,
    requirePhotoForProfile: row.requirePhotoForProfile,
    applicationsOpen: row.applicationsOpen,
    announcement: row.announcement,
  };
});

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

export const settingsSchema = z.object({
  publicJobPreview: checkbox,
  requireCvForProfile: checkbox,
  requirePhotoForProfile: checkbox,
  applicationsOpen: checkbox,
  announcement: optionalText(240),
});

export async function updateSettings(actor: Actor, raw: Record<string, string>): Promise<Settings> {
  if (!canManageSettings(actor)) throw forbidden();
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) throw validationError("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  const data = { ...parsed.data, announcement: parsed.data.announcement ?? null };
  await db.$transaction(async (tx) => {
    await tx.siteSettings.createMany({ data: [{ id: 1 }], skipDuplicates: true });
    await tx.siteSettings.update({ where: { id: 1 }, data });
    await audit({ actorId: actor.id, action: "settings.update", entityType: "SiteSettings", entityId: "1", metadata: data }, tx);
  });
  const row = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  return {
    publicJobPreview: row.publicJobPreview,
    requireCvForProfile: row.requireCvForProfile,
    requirePhotoForProfile: row.requirePhotoForProfile,
    applicationsOpen: row.applicationsOpen,
    announcement: row.announcement,
  };
}
