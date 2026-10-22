import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { sitemapJobs } from "@/server/services/job-service";
import { getSettings } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

/** Public pages plus live, non-demo vacancies. Never includes candidate data. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages = ["", "/jobs", "/about", "/reviews", "/career-assistance", "/freelance-outsourcing", "/contact", "/privacy", "/terms"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: (p === "" || p === "/jobs" ? "daily" : "monthly") as "daily" | "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
  const settings = await getSettings();
  const jobs = settings.publicJobPreview ? (await sitemapJobs()).filter((j) => !j.isDemo) : [];
  return [
    ...staticPages,
    ...jobs.map((j) => ({ url: `${base}/jobs/${j.slug}`, lastModified: j.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
