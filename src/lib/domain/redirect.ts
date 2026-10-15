/**
 * Accepts only same-site relative paths for post-login redirects. Anything
 * else (absolute URLs, protocol-relative "//evil.com", backslash tricks,
 * control characters) falls back to the default — this closes open-redirect
 * holes via the ?next= parameter.
 */
export function safeNextPath(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\\]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "http://internal.invalid");
    if (url.host !== "internal.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
