import { randomUUID } from "node:crypto";
import type { FileKind } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sha256Hex } from "@/lib/crypto";
import { notFound, validationError } from "@/lib/errors";
import { canDownloadFile, type Actor } from "../auth/policies";
import { databaseStorage } from "../storage/storage";
import { sanitizeFilename, validateDocument } from "../storage/file-validation";

export const maxUploadBytes = () => Math.floor(env().MAX_UPLOAD_MB * 1024 * 1024);

export interface IncomingFile {
  name: string;
  bytes: Buffer;
}

/** Reads a File from FormData; returns null when no file was chosen. */
export async function readUpload(value: FormDataEntryValue | null): Promise<IncomingFile | null> {
  if (!value || typeof value === "string") return null;
  if (value.size === 0 && !value.name) return null;
  if (value.size > maxUploadBytes()) {
    throw validationError("Upload failed", { file: [`The file is too large. The maximum size is ${env().MAX_UPLOAD_MB} MB.`] });
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
  const result = validateDocument(input.file.bytes, input.file.name, maxUploadBytes());
  if (!result.ok) throw validationError("Upload failed", { file: [result.error] });
  const storageKey = `${input.kind.toLowerCase()}/${randomUUID()}`;
  await databaseStorage(tx).put(storageKey, input.file.bytes);
  return tx.storedFile.create({
    data: {
      kind: input.kind,
      ownerId: input.ownerId,
      originalName: sanitizeFilename(input.file.name, result.ext),
      mimeType: result.mimeType,
      sizeBytes: input.file.bytes.length,
      sha256: sha256Hex(input.file.bytes),
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
