import { CheckCircle2, Lock, LogIn, UserPlus } from "lucide-react";
import { ButtonLink } from "../ui/button";

/** Shown to signed-out visitors on gated job-board routes. */
export function BoardGate({ next, liveCount }: { next: string; liveCount: number }) {
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-2xl rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Lock aria-hidden className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Sign in to browse the job board</h1>
        <p className="mt-3 text-ink-700">
          {liveCount > 0 ? (
            <>
              There {liveCount === 1 ? "is" : "are"} currently <strong>{liveCount}</strong> open {liveCount === 1 ? "vacancy" : "vacancies"}.{" "}
            </>
          ) : null}
          To protect candidates and employers, the full job board is available to registered candidates with a completed profile.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-ink-700">
          {["Create a free account", "Complete your profile and upload your CV", "Search, filter and apply for vacancies"].map((s) => (
            <li key={s} className="flex items-center gap-2">
              <CheckCircle2 aria-hidden className="size-4 text-success-700" /> {s}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/register${q}`} size="lg">
            <UserPlus aria-hidden className="size-4" /> Create account
          </ButtonLink>
          <ButtonLink href={`/login${q}`} size="lg" variant="secondary">
            <LogIn aria-hidden className="size-4" /> Sign in
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
