/**
 * Removes every demo vacancy (isDemo = true) and any applications made to
 * them. Run before launch: `npm run db:demo:remove -- --yes`.
 */
import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  const jobs = await db.job.findMany({ where: { isDemo: true }, select: { id: true } });
  const ids = jobs.map((j) => j.id);
  const apps = await db.application.count({ where: { jobId: { in: ids } } });
  console.log(`Found ${ids.length} demo jobs with ${apps} applications.`);
  if (ids.length === 0) return;
  if (!process.argv.includes("--yes")) {
    console.log("Dry run. Re-run with --yes to delete them.");
    return;
  }
  await db.$transaction(async (tx) => {
    await tx.application.deleteMany({ where: { jobId: { in: ids } } });
    await tx.job.deleteMany({ where: { id: { in: ids } } });
    await tx.auditEvent.create({
      data: { action: "demo.remove", entityType: "Job", metadata: { jobs: ids.length, applications: apps } },
    });
  });
  console.log("Demo data removed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
