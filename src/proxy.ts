import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page request:
 *  1. Issues a per-request CSP nonce (strict script policy).
 *  2. Fast-redirects obviously signed-out visitors away from private areas.
 *     This is a UX shortcut only — real authorisation happens server-side
 *     in every page and action (see src/server/auth/current.ts).
 *  3. Marks private areas no-store / noindex.
 */
const PRIVATE_PREFIXES = ["/account", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes (e.g. progress widths) need 'unsafe-inline'; scripts stay strict.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminLogin = pathname === "/admin/login";
  const hasSession = request.cookies.has("__Host-tap_session") || request.cookies.has("tap_session");

  if (isPrivate && !isAdminLogin && !hasSession) {
    const login = new URL(pathname.startsWith("/admin") ? "/admin/login" : "/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname + search);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (isPrivate || pathname.startsWith("/reset-password") || pathname.startsWith("/verify-email")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|brand|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
