import type { SalaryPeriodValue } from "./labels";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });

export function formatNaira(amount: number): string {
  return ngn.format(amount);
}

/** "₦150,000 – ₦250,000 / month"; null when no salary was published. */
export function formatSalary(min: number | null, max: number | null, period: SalaryPeriodValue | null): string | null {
  if (min == null && max == null) return null;
  const per = period === "YEAR" ? " / year" : period === "MONTH" ? " / month" : "";
  if (min != null && max != null && min !== max) return `${formatNaira(min)} – ${formatNaira(max)}${per}`;
  if (min != null && max != null) return `${formatNaira(min)}${per}`;
  if (min != null) return `From ${formatNaira(min)}${per}`;
  return `Up to ${formatNaira(max as number)}${per}`;
}

export function formatCount(n: number): string {
  return n < 10_000 ? n.toLocaleString("en-NG") : compact.format(n);
}

const dateFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
const dateTimeFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);

/** "today", "3 days ago", or a date for anything older than a month. */
export function formatRelative(d: Date, now = new Date()): string {
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(d);
}

export function formatExperience(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} years`;
  if (min != null && max != null) return `${min} year${min === 1 ? "" : "s"}`;
  if (min != null) return min === 0 ? "No experience required" : `${min}+ years`;
  return `Up to ${max} years`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
