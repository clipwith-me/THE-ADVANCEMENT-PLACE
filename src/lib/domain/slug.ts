import { randomBytes } from "node:crypto";

export function slugify(input: string, maxLength = 60): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** Descriptive, collision-resistant public URL slug: "accounts-officer-abeokuta-k3f9x2". */
export function jobSlug(title: string, location?: string | null): string {
  const base = slugify([title, location].filter(Boolean).join(" ")) || "job";
  const suffix = randomBytes(4).toString("hex").slice(0, 6);
  return `${base}-${suffix}`;
}

/** Normalised key for de-duplicating skills ("  MS   Excel " → "ms excel"). */
export function skillKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
