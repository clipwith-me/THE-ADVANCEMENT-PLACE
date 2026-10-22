/**
 * Data-retention job. Deletes private documents that no longer have a
 * business purpose, after RETENTION_DAYS (default 365):
 *   - CVs attached only to unsuccessful/withdrawn applications last updated
 *     before the cut-off (and not the candidate's current CV)
 *   - passport photos under the same rule (and not the candidate's current photo)
 *   - attachments of enquiries resolved before the cut-off
 *   - reviews that were hidden (not published) before the cut-off
 *   - expired sessions and used/expired auth tokens
 *
 * Dry run by default; pass --yes to delete. Schedule it monthly (e.g. a cron
 * job or the host's scheduler). Review the period with the client's legal adviser.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { env } from "../src/lib/env";

async function main() {
  const apply = process.argv.includes("--yes");
  const cutoff = new Date(Date.now() - env().RETENTION_DAYS * 86_400_000);

  const candidateCvs = await db.storedFile.findMany({
    where: {
      kind: "CV",
      currentCvOf: null,
      applications: { some: {}, every: { status: { in: ["UNSUCCESSFUL", "WITHDRAWN"] }, updatedAt: { lt: cutoff } } },
    },
    select: { id: true, storageKey: true },
  });
  const candidatePhotos = await db.storedFile.findMany({
    where: {
      kind: "PHOTO",
      photoOf: null,
      photoApplications: { some: {}, every: { status: { in: ["UNSUCCESSFUL", "WITHDRAWN"] }, updatedAt: { lt: cutoff } } },
    },
    select: { id: true, storageKey: true },
  });
  const enquiryFiles = await db.storedFile.findMany({
    where: { kind: "ENQUIRY_ATTACHMENT", enquiries: { every: { status: "RESOLVED", updatedAt: { lt: cutoff } } } },
    select: { id: true, storageKey: true },
  });
  const files = [...candidateCvs, ...candidatePhotos, ...enquiryFiles];

  console.log(`Retention cut-off: ${cutoff.toISOString()} (${env().RETENTION_DAYS} days)`);
  console.log(
    `CVs eligible for deletion: ${candidateCvs.length}; photos: ${candidatePhotos.length}; enquiry attachments: ${enquiryFiles.length}`,
  );
  if (!apply) {
    console.log("Dry run. Re-run with --yes to delete.");
    return;
  }
  for (const f of files) {
    await db.$transaction([
      db.fileBlob.deleteMany({ where: { key: f.storageKey } }),
      db.storedFile.delete({ where: { id: f.id } }),
    ]);
  }
  const reviews = await db.review.deleteMany({ where: { status: "REJECTED", moderatedAt: { lt: cutoff } } });
  const sessions = await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const tokens = await db.authToken.deleteMany({ where: { OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] } });
  await db.auditEvent.create({
    data: { action: "retention.purge", entityType: "StoredFile", metadata: { files: files.length, reviews: reviews.count, sessions: sessions.count, tokens: tokens.count } },
  });
  console.log(`Deleted ${files.length} files, ${reviews.count} hidden reviews, ${sessions.count} expired sessions, ${tokens.count} spent tokens.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
