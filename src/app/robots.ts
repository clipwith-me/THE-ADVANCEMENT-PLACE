import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api", "/reset-password", "/verify-email"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
