import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";
import { BoardGate } from "@/components/jobs/board-gate";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters, SortSelect } from "@/components/jobs/job-filters";
import { JobSearchBar } from "@/components/jobs/job-search-bar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { pageMetadata } from "@/lib/seo";
import { parseJobSearch } from "@/lib/validation/job";
import { getCurrentUser } from "@/server/auth/current";
import { getCompleteness } from "@/server/services/profile-service";
import { categoriesWithCounts, liveJobCount, searchJobs } from "@/server/services/job-service";

export const metadata = pageMetadata({
  title: "Find Jobs",
  description: "Search and filter current job vacancies in Nigeria — full-time, part-time, contract, internship and remote roles.",
  path: "/jobs",
});

type Params = Record<string, string | string[] | undefined>;

export default async function JobsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) for (const item of Array.isArray(v) ? v : v ? [v] : []) qs.append(k, item);
  const here = `/jobs${qs.size ? `?${qs}` : ""}`;

  // The job board is gated: candidates need an account and a complete profile.
  const user = await getCurrentUser();
  if (!user) return <BoardGate next={here} liveCount={await liveJobCount()} />;
  if (user.role === "CANDIDATE") {
    const { result } = await getCompleteness(user.id);
    if (!result.complete) redirect(`/account/setup?next=${encodeURIComponent(here)}`);
  }

  const search = parseJobSearch(params);
  const [{ items, total, page, pageCount }, categories] = await Promise.all([searchJobs(search), categoriesWithCounts()]);
  const hasFilters = Boolean(search.q || search.location || search.category || search.type.length || search.arrangement.length);
  const hiddenForSearch: Record<string, string | string[]> = {
    ...(search.category ? { category: search.category } : {}),
    ...(search.type.length ? { type: search.type } : {}),
    ...(search.arrangement.length ? { arrangement: search.arrangement } : {}),
    ...(search.sort !== "newest" ? { sort: search.sort } : {}),
  };

  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-10 sm:py-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Find jobs</h1>
          <p className="mt-2 text-ink-600">Search current vacancies and filter by what matters to you.</p>
          <div className="mt-6 max-w-4xl">
            <JobSearchBar q={search.q} location={search.location} variant="compact" hidden={hiddenForSearch} />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:py-10">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <JobFilters search={search} categories={categories} />
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="results-heading" className="text-sm text-ink-700" aria-live="polite">
              <strong className="text-ink-900">{total}</strong> {total === 1 ? "job" : "jobs"} found
              {search.q && (
                <>
                  {" "}
                  for “<span className="font-medium text-ink-900">{search.q}</span>”
                </>
              )}
              {search.location && (
                <>
                  {" "}
                  in <span className="font-medium text-ink-900">{search.location}</span>
                </>
              )}
            </h2>
            <SortSelect search={search} />
          </div>

          {items.length > 0 ? (
            <div className="grid gap-4">
              {items.map((job) => (
                <JobCard key={job.id} job={job} headingLevel="h3" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title={hasFilters ? "No jobs match your search" : "No open vacancies right now"}
              action={hasFilters ? <ButtonLink href="/jobs" variant="secondary">Clear search and filters</ButtonLink> : undefined}
            >
              {hasFilters
                ? "Try a broader keyword, a different location, or fewer filters."
                : "New roles are published regularly. Check back soon — your profile is ready for when they are."}
            </EmptyState>
          )}

          <Pagination page={page} pageCount={pageCount} basePath="/jobs" params={params} />
        </section>
      </div>
    </>
  );
}
