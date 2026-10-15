import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { BUSINESS } from "@/lib/business";
import { env } from "@/lib/env";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime requests to Google.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(env().APP_URL),
    title: { default: `${BUSINESS.name} — Jobs, Recruitment & Career Services`, template: `%s | ${BUSINESS.name}` },
    description:
      "Discover job vacancies, build your professional profile and get career support from The Advancement Place, a recruitment and career services business in Abeokuta, Ogun State.",
    applicationName: BUSINESS.name,
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" }],
      apple: "/brand/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${inter.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
