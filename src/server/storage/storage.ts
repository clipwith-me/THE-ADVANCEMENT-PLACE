import { db } from "@/lib/db";

/**
 * Pluggable private storage. The default keeps bytes in PostgreSQL: private
 * by construction (nothing is served statically), persistent across
 * redeploys, and included in database backups — no extra paid service for an
 * MVP handling a few thousand CVs. Implement this interface with S3/R2 when
 * volume makes database storage uneconomical (see docs/architecture.md).
 */
export interface StorageProvider {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

type BlobClient = Pick<typeof db, "fileBlob">;

export function databaseStorage(client: BlobClient = db): StorageProvider {
  return {
    async put(key, data) {
      await client.fileBlob.create({ data: { key, data: new Uint8Array(data) } });
    },
    async get(key) {
      const row = await client.fileBlob.findUnique({ where: { key } });
      return row ? Buffer.from(row.data) : null;
    },
    async delete(key) {
      await client.fileBlob.deleteMany({ where: { key } });
    },
  };
}

export const storage: StorageProvider = databaseStorage();
