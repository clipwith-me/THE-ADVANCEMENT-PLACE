import type { NextConfig } from "next";

// Security headers that don't depend on the per-request nonce. The CSP itself is
// set in src/proxy.ts because it carries a fresh nonce for every request.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS only in production, where the deployment is HTTPS-only.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // pg, argon2 and sharp are native/Node-only; keep them out of the server bundle.
  serverExternalPackages: ["@node-rs/argon2", "pg", "sharp"],
  experimental: {
    serverActions: {
      // CV/attachment uploads go through Server Actions. The app enforces its own
      // (smaller) per-file limit (5 MB candidates, 15 MB admin images); this is only the transport ceiling.
      bodySizeLimit: "16mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
