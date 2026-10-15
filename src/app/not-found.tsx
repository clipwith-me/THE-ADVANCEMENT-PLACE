import { Compass } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="container-page py-20 text-center sm:py-28">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Compass aria-hidden className="size-7" />
          </span>
          <p className="mt-6 text-sm font-semibold text-brand-700">404</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-600">
            The page may have moved, or the vacancy may no longer be available.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/jobs">Browse jobs</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Go to the homepage
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
