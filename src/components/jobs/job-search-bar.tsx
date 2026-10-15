import { MapPin, Search } from "lucide-react";
import { buttonClasses } from "../ui/button";

/** Plain GET form: works without JavaScript and produces shareable URLs. */
export function JobSearchBar({
  q,
  location,
  variant = "hero",
  hidden,
}: {
  q?: string;
  location?: string;
  variant?: "hero" | "compact";
  hidden?: Record<string, string | string[]>;
}) {
  const hero = variant === "hero";
  return (
    <form
      action="/jobs"
      method="get"
      role="search"
      aria-label="Search jobs"
      className={`grid gap-2 rounded-xl bg-white p-2 sm:grid-cols-[1fr_1fr_auto] ${hero ? "shadow-lift ring-1 ring-ink-200" : "ring-1 ring-ink-300"}`}
    >
      {Object.entries(hidden ?? {}).flatMap(([k, v]) =>
        (Array.isArray(v) ? v : [v]).map((val) => <input key={`${k}-${val}`} type="hidden" name={k} value={val} />),
      )}
      <label className="flex min-h-12 items-center gap-2 rounded-lg px-3 focus-within:ring-2 focus-within:ring-brand-300">
        <Search aria-hidden className="size-5 shrink-0 text-ink-500" />
        <span className="sr-only">Keyword</span>
        <input
          name="q"
          defaultValue={q}
          type="search"
          maxLength={100}
          placeholder="Job title, skill or keyword"
          className="w-full bg-transparent text-base text-ink-900 placeholder:text-ink-500 focus:outline-none"
        />
      </label>
      <label className="flex min-h-12 items-center gap-2 rounded-lg px-3 focus-within:ring-2 focus-within:ring-brand-300 sm:border-l sm:border-ink-200">
        <MapPin aria-hidden className="size-5 shrink-0 text-ink-500" />
        <span className="sr-only">Location</span>
        <input
          name="location"
          defaultValue={location}
          maxLength={60}
          placeholder="State, city or “remote”"
          className="w-full bg-transparent text-base text-ink-900 placeholder:text-ink-500 focus:outline-none"
        />
      </label>
      <button type="submit" className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
        Search jobs
      </button>
    </form>
  );
}
