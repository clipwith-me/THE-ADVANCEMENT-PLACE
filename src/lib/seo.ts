import type { Metadata } from "next";
import { BUSINESS } from "./business";
import { env } from "./env";

export const siteUrl = () => env().APP_URL;

/** Page metadata with canonical URL and Open Graph defaults. */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${BUSINESS.name}`,
      description,
      url: path,
      siteName: BUSINESS.name,
      locale: "en_NG",
      type: "website",
      images: [{ url: "/brand/logo-lockup.jpg", width: 638, height: 544, alt: BUSINESS.name }],
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

/** Private pages: never indexed, never cached by shared caches (see proxy). */
export const privateMetadata = (title: string): Metadata => ({ title, robots: { index: false, follow: false } });
