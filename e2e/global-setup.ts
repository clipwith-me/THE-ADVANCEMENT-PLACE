import { execSync } from "node:child_process";
import { Client } from "pg";

/**
 * Prepares the disposable e2e database: applies migrations (non-destructive),
 * empties its tables, then loads reference data, demo jobs and one admin.
 * Guarded so it can only ever touch a database whose URL contains "e2e".
 */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? "postgresql://tap:tap@localhost:5432/tap_e2e?schema=public";
  if (!/e2e/.test(new URL(url).pathname)) throw new Error("Refusing to prepare a database whose name doesn't contain 'e2e'.");
  const env = { ...process.env, DATABASE_URL: url, NODE_ENV: "development" as const, SESSION_SECRET: "e2e-secret-9f8e7d6c5b4a39281706f5e4d3c2b1a0" };
  const run = (cmd: string, input?: string) => execSync(cmd, { env, input, stdio: ["pipe", "ignore", "inherit"] });

  run("npx prisma migrate deploy");
  const client = new Client({ connectionString: url });
  await client.connect();
  const { rows } = await client.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
  );
  await client.query(`TRUNCATE TABLE ${rows.map((r) => `"public"."${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await client.end();

  run("npx tsx prisma/seed.ts");
  run("npx tsx prisma/seed-demo.ts");
  run("npx tsx scripts/admin.ts create --email admin@e2e.test --name E2E-Admin --password-stdin", "E2E-admin-password-2026");
}
