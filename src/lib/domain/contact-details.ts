import { BUSINESS } from "../business";

/**
 * Finds contact details (phone numbers, emails, links) in job text, so
 * employers' details can't be published and candidates apply through the
 * website instead of contacting employers directly (client requirement).
 * The agency's own phone, email and domain are allowed.
 */
export type ContactKind = "phone" | "email" | "link";

// Runs of digits with common phone separators. Commas aren't separators, so
// amounts like "₦150,000 – ₦200,000" never join into one long number.
const PHONE_RUN = /\+?\d[\d\s().-]{7,}\d/g;
// A spaced dash or any en/em dash marks a range ("150000 - 250000"); phone numbers use unspaced hyphens.
const RANGE = /\s+-\s+|\s*[–—]\s*/g;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\bwa\.me\/\S*|\b[a-z0-9-]+\.(?:com|ng|net|org|co|io|info|biz|me|link)(?:\.ng)?\b(?:\/\S*)?/gi;

/** Digits in international form: "0803…" → "234803…". */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
}

const AGENCY_PHONE = normalisePhone(BUSINESS.phoneE164);

export function findContactDetails(text: string): ContactKind[] {
  const found = new Set<ContactKind>();
  for (const match of text.replace(RANGE, " | ").match(PHONE_RUN) ?? []) {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15 && normalisePhone(match) !== AGENCY_PHONE) found.add("phone");
  }
  for (const match of text.match(EMAIL) ?? []) {
    if (match.toLowerCase() !== BUSINESS.email) found.add("email");
  }
  // Emails also look like domains, so check links with emails removed.
  for (const match of text.replace(EMAIL, " ").match(LINK) ?? []) {
    if (!match.toLowerCase().includes(BUSINESS.domain)) found.add("link");
  }
  return [...found];
}

const KIND_LABEL: Record<ContactKind, string> = { phone: "phone number", email: "email address", link: "web or WhatsApp link" };

export function contactDetailsMessage(kinds: ContactKind[]): string {
  const list = kinds.map((k) => KIND_LABEL[k]);
  const what = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0];
  return `Remove the ${what}. Candidates must apply through the website, so employers' contact details can't be published (the agency's own number and email are fine).`;
}
