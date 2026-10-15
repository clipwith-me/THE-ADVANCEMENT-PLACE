"use client";

import { useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABEL, WORK_ARRANGEMENTS, WORK_ARRANGEMENT_LABEL } from "@/lib/domain/labels";
import type { JobSearch } from "@/lib/validation/job";
import { buttonClasses } from "../ui/button";

/**
 * Filter panel as a GET form. Every filter is submitted together, so they
 * combine instead of replacing one another. With JavaScript, changes apply
 * immediately; without it, the "Apply filters" button does the same.
 */
export function JobFilters({
  search,
  categories,
}: {
  search: JobSearch;
  categories: { slug: string; name: string; liveCount: number }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const submit = () => formRef.current?.requestSubmit();
  const activeCount = search.type.length + search.arrangement.length + (search.category ? 1 : 0);

  const body = (
    <form ref={formRef} action="/jobs" method="get" className="space-y-6" aria-label="Filter jobs">
      {search.q && <input type="hidden" name="q" value={search.q} />}
      {search.location && <input type="hidden" name="location" value={search.location} />}
      {search.sort !== "newest" && <input type="hidden" name="sort" value={search.sort} />}

      <div>
        <label htmlFor="filter-category" className="text-sm font-semibold text-ink-900">
          Category
        </label>
        <select
          id="filter-category"
          name="category"
          defaultValue={search.category ?? ""}
          onChange={submit}
          className="mt-2 block min-h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-base sm:text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.liveCount})
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-900">Employment type</legend>
        <div className="mt-2 space-y-1">
          {EMPLOYMENT_TYPES.map((t) => (
            <label key={t} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-ink-800">
              <input
                type="checkbox"
                name="type"
                value={t}
                defaultChecked={search.type.includes(t)}
                onChange={submit}
                className="size-5 rounded border-ink-400 accent-brand-700"
              />
              {EMPLOYMENT_TYPE_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-900">Work arrangement</legend>
        <div className="mt-2 space-y-1">
          {WORK_ARRANGEMENTS.map((a) => (
            <label key={a} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-ink-800">
              <input
                type="checkbox"
                name="arrangement"
                value={a}
                defaultChecked={search.arrangement.includes(a)}
                onChange={submit}
                className="size-5 rounded border-ink-400 accent-brand-700"
              />
              {WORK_ARRANGEMENT_LABEL[a]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button type="submit" className={buttonClasses("dark", "sm", "flex-1")}>
          Apply filters
        </button>
        {activeCount > 0 && (
          <a
            href={`/jobs${search.q || search.location ? `?${new URLSearchParams({ ...(search.q ? { q: search.q } : {}), ...(search.location ? { location: search.location } : {}) })}` : ""}`}
            className={buttonClasses("ghost", "sm")}
          >
            Clear
          </a>
        )}
      </div>
    </form>
  );

  return (
    <div className="rounded-lg border border-ink-200 bg-white lg:border-0 lg:bg-transparent">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-semibold lg:hidden"
        aria-expanded={open}
        aria-controls="job-filters-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal aria-hidden className="size-4" /> Filters
          {activeCount > 0 && <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs text-white">{activeCount}</span>}
        </span>
        <ChevronDown aria-hidden className={`size-4 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div id="job-filters-panel" className={`${open ? "block" : "hidden"} border-t border-ink-200 p-4 lg:block lg:border-0 lg:p-0`}>
        {body}
      </div>
    </div>
  );
}

export function SortSelect({ search }: { search: JobSearch }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action="/jobs" method="get" className="flex items-center gap-2">
      {search.q && <input type="hidden" name="q" value={search.q} />}
      {search.location && <input type="hidden" name="location" value={search.location} />}
      {search.category && <input type="hidden" name="category" value={search.category} />}
      {search.type.map((t) => (
        <input key={t} type="hidden" name="type" value={t} />
      ))}
      {search.arrangement.map((a) => (
        <input key={a} type="hidden" name="arrangement" value={a} />
      ))}
      <label htmlFor="sort" className="text-sm whitespace-nowrap text-ink-600">
        Sort by
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={search.sort}
        onChange={() => formRef.current?.requestSubmit()}
        className="min-h-10 rounded-md border border-ink-300 bg-white px-2 text-sm"
      >
        <option value="newest">Most recent</option>
        <option value="deadline">Closing soonest</option>
        <option value="salary">Highest salary</option>
      </select>
      <noscript>
        <button type="submit" className={buttonClasses("secondary", "sm")}>
          Sort
        </button>
      </noscript>
    </form>
  );
}
