import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection on poolers such as
    // Neon's; the app itself uses DATABASE_URL at runtime.
    url: process.env.DIRECT_DATABASE_URL || env("DATABASE_URL"),
  },
});
