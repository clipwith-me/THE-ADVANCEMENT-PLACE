import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection on poolers such as
    // Neon's; the app itself uses DATABASE_URL at runtime. Read leniently so
    // `prisma generate` (run on install, needs no database) works in CI and
    // build environments without credentials; migrate still fails clearly if unset.
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "",
  },
});
