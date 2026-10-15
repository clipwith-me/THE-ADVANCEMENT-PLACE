import { z } from "zod";

/** Trimmed string; empty → undefined so optional fields stay optional. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const requiredText = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

/**
 * Nigerian and international numbers. Normalises local formats
 * ("0803 123 4567") to E.164 ("+2348031234567").
 */
export const phoneField = z
  .string({ error: "Phone number is required" })
  .trim()
  .min(1, "Phone number is required")
  .transform((v) => v.replace(/[\s\-().]/g, ""))
  .refine((v) => /^(\+?\d{10,15})$/.test(v), "Enter a valid phone number, e.g. 0803 123 4567")
  .transform((v) => {
    if (v.startsWith("+")) return v;
    if (v.startsWith("234")) return `+${v}`;
    if (v.startsWith("0") && v.length === 11) return `+234${v.slice(1)}`;
    return `+${v}`;
  });

export const optionalPhoneField = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(phoneField.optional());

/** Only http(s) URLs — blocks javascript:, data: and other schemes. */
export const optionalUrl = (hostCheck?: (host: string) => boolean, hostMessage?: string) =>
  z
    .string()
    .trim()
    .max(300, "URL is too long")
    .optional()
    .transform((v) => (v ? v : undefined))
    .superRefine((v, ctx) => {
      if (!v) return;
      let url: URL;
      try {
        url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter a valid web address" });
        return;
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        ctx.addIssue({ code: "custom", message: "Only http(s) links are allowed" });
        return;
      }
      if (hostCheck && !hostCheck(url.hostname.toLowerCase())) {
        ctx.addIssue({ code: "custom", message: hostMessage ?? "Enter a valid web address" });
      }
    })
    .transform((v) => (v ? new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).toString() : undefined));

/** Bot trap: a visually hidden input real users never fill. */
export const honeypot = z
  .string()
  .optional()
  .refine((v) => !v, "Submission rejected");

/** "a, b,  c" or newline-separated → ["a","b","c"] with de-duplication. */
export function splitList(raw: unknown, separator: RegExp = /[,\n]/): string[] {
  if (typeof raw !== "string") return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(separator)) {
    const v = part.trim().replace(/\s+/g, " ");
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** FormData → plain object of strings (files are excluded; read them explicitly). */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  }
  return out;
}

export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
