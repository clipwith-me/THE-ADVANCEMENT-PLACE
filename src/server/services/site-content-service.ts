import { db } from "@/lib/db";
import { forbidden, notFound } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation/parse";
import { sitePhotoCaptionSchema } from "@/lib/validation/review";
import { audit } from "../audit";
import { canManageSiteContent, type Actor } from "../auth/policies";
import { deleteStoredFile, storeDocument, type IncomingFile } from "./file-service";

const MAX_PHOTOS = 40;

function assertManager(actor: Actor) {
  if (!canManageSiteContent(actor)) throw forbidden();
}

/** Published About-page photos, in display order. Empty until staff upload some. */
export async function publishedSitePhotos() {
  return db.sitePhoto.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, fileId: true, caption: true },
  });
}

export async function listSitePhotosForAdmin(actor: Actor) {
  assertManager(actor);
  return db.sitePhoto.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { file: { select: { sizeBytes: true, originalName: true } } },
  });
}

export async function uploadSitePhoto(actor: Actor, file: IncomingFile, raw: Record<string, string>) {
  assertManager(actor);
  const { caption } = parseOrThrow(sitePhotoCaptionSchema, raw);
  if ((await db.sitePhoto.count()) >= MAX_PHOTOS) throw forbidden(`You can keep up to ${MAX_PHOTOS} photos. Delete one to add another.`);
  return db.$transaction(async (tx) => {
    const stored = await storeDocument(tx, { kind: "SITE_PHOTO", ownerId: null, file });
    const last = await tx.sitePhoto.aggregate({ _max: { sortOrder: true } });
    const photo = await tx.sitePhoto.create({ data: { fileId: stored.id, caption, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    await audit({ actorId: actor.id, action: "site_photo.upload", entityType: "SitePhoto", entityId: photo.id }, tx);
    return photo;
  });
}

export async function updateSitePhoto(actor: Actor, id: string, raw: Record<string, string>) {
  assertManager(actor);
  const { caption } = parseOrThrow(sitePhotoCaptionSchema, raw);
  const photo = await db.sitePhoto.findUnique({ where: { id } });
  if (!photo) throw notFound();
  await db.sitePhoto.update({ where: { id }, data: { caption } });
  await audit({ actorId: actor.id, action: "site_photo.caption", entityType: "SitePhoto", entityId: id });
}

export async function setSitePhotoPublished(actor: Actor, id: string, published: boolean) {
  assertManager(actor);
  const photo = await db.sitePhoto.findUnique({ where: { id } });
  if (!photo) throw notFound();
  await db.sitePhoto.update({ where: { id }, data: { published } });
  await audit({ actorId: actor.id, action: published ? "site_photo.show" : "site_photo.hide", entityType: "SitePhoto", entityId: id });
}

/** Swaps a photo with its neighbour so the order is always contiguous and stable. */
export async function moveSitePhoto(actor: Actor, id: string, direction: "up" | "down") {
  assertManager(actor);
  await db.$transaction(async (tx) => {
    const all = await tx.sitePhoto.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const i = all.findIndex((p) => p.id === id);
    if (i === -1) throw notFound();
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= all.length) return;
    [all[i], all[j]] = [all[j]!, all[i]!];
    for (const [index, p] of all.entries()) await tx.sitePhoto.update({ where: { id: p.id }, data: { sortOrder: index + 1 } });
  });
}

export async function deleteSitePhoto(actor: Actor, id: string) {
  assertManager(actor);
  const photo = await db.sitePhoto.findUnique({ where: { id } });
  if (!photo) throw notFound();
  await db.$transaction(async (tx) => {
    // Deleting the file cascades to the SitePhoto row.
    await deleteStoredFile(tx, photo.fileId);
    await audit({ actorId: actor.id, action: "site_photo.delete", entityType: "SitePhoto", entityId: id }, tx);
  });
}
