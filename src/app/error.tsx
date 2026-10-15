"use client";

import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/** Application error boundary. Shows only the opaque digest, never the error text. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex flex-1 items-center">
      <div className="container-page py-20 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-50 text-danger-700">
          <TriangleAlert aria-hidden className="size-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-600">
          We couldn&apos;t load this page. Please try again. If the problem continues, contact us and quote the reference below.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-ink-500">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className={buttonClasses("primary")}>
            <RefreshCw aria-hidden className="size-4" /> Try again
          </button>
          <Link href="/" className={buttonClasses("secondary")}>
            Go to the homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
