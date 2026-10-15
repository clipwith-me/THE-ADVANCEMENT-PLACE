import { z } from "zod";

/**
 * Server-side configuration, validated once on first use. None of these names
 * carry the NEXT_PUBLIC_ prefix, so Next.js never inlines them into browser
 * bundles. Add new variables here AND in .env.example.
 */
const boolish = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform((u) => u.replace(/\/+$/, "")),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: boolish,
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default("The Advancement Place <no-reply@theadvancementplace.com>"),
  NOTIFY_EMAIL: z.string().email().default("advancementplace@gmail.com"),

  REQUIRE_EMAIL_VERIFICATION: boolish,
  MAX_UPLOAD_MB: z.coerce.number().positive().max(7).default(5),
  RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.SESSION_SECRET.startsWith("dev-only")) {
    throw new Error("SESSION_SECRET must be replaced with a strong random value in production");
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = () => env().NODE_ENV === "production";
export const emailConfigured = () => Boolean(env().SMTP_HOST);
