import { randomUUID } from "node:crypto";
import type { FileKind } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sha256Hex } from "@/lib/crypto";
import { notFound, validationError } from "@/lib/errors";
import { publicJobState } from "@/lib/domain/job-visibility";
import { canDownloadFile, isAdmin, type Actor } from "../auth/policies";
import { getSettings } from "./settings-service";
import { databaseStorage } from "../storage/storage";
import { sanitizeFilename, sanitizeImageName, validateDocument, validateImage } from "../storage/file-validation";
import { toWebJpeg } from "../storage/image-processing";

export const maxUploadBytes = () => Math.floor(env().MAX_UPLOAD_MB * 1024 * 1024);
/** Admin-only image uploads (website photos, job flyers) are resized on upload, so larger originals are fine. */
export const ADMIN_IMAGE_MAX_BYTES = 15 * 1024 * 1024;
const WEB_IMAGE_MAX_SIDE = { SITE_PHOTO: 2000, JOB_FLYER: 2400 } as const;

export interface IncomingFile {
  name: string;
  bytes: Buffer;
}

/** Reads a File from FormData; returns null when no file was chosen. */
export async function readUpload(value: FormDataEntryValue | null, maxBytes = maxUploadBytes()): Promise<IncomingFile | null> {
  if (!value || typeof value === "string") return null;
  // Browsers submit an empty file part when no file was chosen (its name
  // varies by browser), so any zero-byte upload counts as "no file".
  if (value.size === 0) return null;
  if (value.size > maxBytes) {
    throw validationError("Upload failed", { file: [`The file is too large. The maximum size is ${Math.floor(maxBytes / (1024 * 1024))} MB.`] });
  }
  return { name: value.name || "document", bytes: Buffer.from(await value.arrayBuffer()) };
}

/**
 * Validates and stores a private document inside the caller's transaction so
 * metadata and bytes are written atomically.
 */
export async function storeDocument(
  tx: Prisma.TransactionClient,
  input: { kind: FileKind; ownerId: string | null; file: IncomingFile },
) {
  let bytes: Buffer;
  let mimeType: string;
  let originalName: string;
  const isPdf = /\.pdf$/i.test(input.file.name);
  if (input.kind === "PHOTO") {
    // Photos are re-written without metadata (location, device) before storage.
    const result = validateImage(input.file.bytes, input.file.name, maxUploadBytes());
    if (!result.ok) throw validationError("Upload failed", { file: [result.error] });
    ({ bytes, mimeType } = result);
    originalName = sanitizeImageName(input.file.name, result.ext);
  } else if (input.kind === "SITE_PHOTO" || (input.kind === "JOB_FLYER" && !isPdf)) {
    // Public images: validated, then re-encoded at web size (also strips metadata).
    const result = validateImage(input.file.bytes, input.file.name, ADMIN_IMAGE_MAX_BYTES);
    if (!result.ok) {
      const error = input.kind === "JOB_FLYER" ? result.error.replace("Upload a JPEG or PNG photo.", "Upload the flyer as a JPEG, PNG or PDF.") : result.error;
      throw validationError("Upload failed", { file: [error] });
    }
    try {
      bytes = (await toWebJpeg(result.bytes, WEB_IMAGE_MAX_SIDE[input.kind])).bytes;
    } catch {
      throw validationError("Upload failed", { file: ["This image couldn't be read. Please try a different file."] });
    }
    mimeType = "image/jpeg";
    originalName = sanitizeImageName(input.file.name, "jpg");
  } else {
    const limit = input.kind === "JOB_FLYER" ? ADMIN_IMAGE_MAX_BYTES : maxUploadBytes();
    const result = validateDocument(input.file.bytes, input.file.name, limit);
    if (!result.ok) throw validationError("Upload failed", { file: [result.error] });
    if (input.kind === "JOB_FLYER" && result.ext !== "pdf") {
      throw validationError("Upload failed", { file: ["Upload the flyer as a JPEG, PNG or PDF."] });
    }
    bytes = input.file.bytes;
    mimeType = result.mimeType;
    originalName = sanitizeFilename(input.file.name, result.ext);
  }
  const storageKey = `${input.kind.toLowerCase()}/${randomUUID()}`;
  await databaseStorage(tx).put(storageKey, bytes);
  return tx.storedFile.create({
    data: {
      kind: input.kind,
      ownerId: input.ownerId,
      originalName,
      mimeType,
      sizeBytes: bytes.length,
      sha256: sha256Hex(bytes),
      storageKey,
    },
  });
}

export async function deleteStoredFile(tx: Prisma.TransactionClient, fileId: string) {
  const file = await tx.storedFile.findUnique({ where: { id: fileId } });
  if (!file) return;
  await databaseStorage(tx).delete(file.storageKey);
  await tx.storedFile.delete({ where: { id: fileId } });
}

/**
 * Authorised download. Unauthorised requests get the same "not found" as a
 * missing file, so IDs can't be probed for existence.
 */
export async function getFileForDownload(actor: Actor | null, fileId: string) {
  if (!/^[a-z0-9]{10,40}$/i.test(fileId)) throw notFound();
  const file = await db.storedFile.findUnique({ where: { id: fileId } });
  if (!file || !canDownloadFile(actor, file)) throw notFound();
  const data = await databaseStorage().get(file.storageKey);
  if (!data) throw notFound();
  return { file, data };
}

/**
 * Files that may be shown on public pages: published website photos, and job
 * flyers while their job is publicly visible (respecting the "show job
 * adverts publicly" setting). Admins can always preview. Everything else —
 * CVs, candidate photos, enquiry attachments — is never served here.
 */
export async function getPublicMedia(actor: Actor | null, fileId: string) {
  if (!/^[a-z0-9]{10,40}$/i.test(fileId)) throw notFound();
  const file = await db.storedFile.findUnique({
    where: { id: fileId },
    include: {
      sitePhoto: { select: { published: true } },
      flyerOf: { select: { status: true, publishedAt: true, deadline: true } },
    },
  });
  if (!file || (file.kind !== "SITE_PHOTO" && file.kind !== "JOB_FLYER")) throw notFound();
  let isPublic = false;
  if (file.kind === "SITE_PHOTO") isPublic = Boolean(file.sitePhoto?.published);
  if (file.kind === "JOB_FLYER" && file.flyerOf && publicJobState(file.flyerOf) !== "HIDDEN") {
    isPublic = (await getSettings()).publicJobPreview || Boolean(actor);
  }
  if (!isPublic && !isAdmin(actor)) throw notFound();
  const data = await databaseStorage().get(file.storageKey);
  if (!data) throw notFound();
  return { file, data, isPublic };
}
