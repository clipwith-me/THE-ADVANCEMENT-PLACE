import { MessageSquareHeart } from "lucide-react";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { PageHero } from "@/components/site/page-hero";
import { Pagination } from "@/components/ui/misc";
import { BUSINESS } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";
import { listApprovedReviews } from "@/server/services/review-service";

export const metadata = pageMetadata({
  title: "Reviews",
  description: `Read reviews from job seekers and employers who have worked with ${BUSINESS.name} in Abeokuta, and share your own experience.`,
  path: "/reviews",
});

type Params = Record<string, string | string[] | undefined>;

// No review structured data (AggregateRating): Google doesn't show
// self-published reviews of a business in search results.
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(500, Number(params.page) || 1));
  const { items, total, pageCount } = await listApprovedReviews(page);

  return (
    <>
      <PageHero eyebrow="Reviews" title="What people say about us">
        Reviews from job seekers, employers and clients we&apos;ve worked with. Every review is checked by our team before it appears here.
      </PageHero>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-12">
        <section aria-labelledby="list-heading" className="min-w-0">
          <h2 id="list-heading" className="sr-only">
            Reviews
          </h2>
          {items.length === 0 ? (
            <div className="card flex flex-col items-center p-10 text-center">
              <MessageSquareHeart aria-hidden className="size-10 text-brand-600" />
              <p className="mt-4 text-lg font-semibold text-ink-900">No reviews yet</p>
              <p className="mt-1 max-w-sm text-ink-600">Have you worked with us? Be the first to share your experience.</p>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-ink-600">
                {total} review{total === 1 ? "" : "s"}
              </p>
              <ul className="grid gap-5 sm:grid-cols-2">
                {items.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} />
                  </li>
                ))}
              </ul>
              <Pagination page={page} pageCount={pageCount} basePath="/reviews" params={params} />
            </>
          )}
        </section>

        <section id="leave-review" aria-labelledby="form-heading" className="card scroll-mt-24 p-5 sm:p-7 lg:sticky lg:top-24 lg:self-start">
          <h2 id="form-heading" className="text-xl font-semibold">
            Leave a review
          </h2>
          <p className="mt-1 mb-6 text-sm text-ink-600">Fields marked * are required.</p>
          <ReviewForm />
        </section>
      </div>
    </>
  );
}
