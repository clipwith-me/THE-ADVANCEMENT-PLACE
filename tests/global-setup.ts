import { execSync } from "node:child_process";

/** Applies migrations to the dedicated test database once per run. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://tap:tap@localhost:5432/tap_test?schema=public";
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: url } });
}
