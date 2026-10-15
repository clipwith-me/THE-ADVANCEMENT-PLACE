import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { FullLogo } from "./logo";

/** Two-column auth layout: the form, and a brand panel on large screens. */
export function AuthShell({
  title,
  description,
  children,
  footer,
  points,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  points?: string[];
}) {
  return (
    <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <div className="mt-2 text-ink-600">{description}</div>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-ink-200 pt-6 text-sm text-ink-600">{footer}</div>}
      </div>
      <div className="hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-50 p-12 lg:block">
        <FullLogo className="h-44 w-auto" />
        <ul className="mt-10 space-y-4">
          {(points ?? [
            "Search and filter current vacancies",
            "Apply with your saved profile and CV",
            "Track every application in one place",
            "Your CV stays private to you and our recruitment team",
          ]).map((p) => (
            <li key={p} className="flex items-start gap-3 text-ink-700">
              <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
