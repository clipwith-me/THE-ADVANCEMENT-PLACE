import { Quote } from "lucide-react";
import { formatDate } from "@/lib/domain/format";
import { REVIEWER_TYPE_LABEL } from "@/lib/domain/labels";
import type { PublicReview } from "@/server/services/review-service";
import { Stars } from "./stars";

/** An approved review. Shows the shortened display name only — never the email. */
export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <figure className="card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <Quote aria-hidden className="size-5 text-brand-200" />
      </div>
      <blockquote className="mt-4 flex-1 leading-relaxed whitespace-pre-line text-ink-800">{review.comment}</blockquote>
      <figcaption className="mt-5 border-t border-ink-100 pt-4 text-sm">
        <span className="font-semibold text-ink-900">{review.displayName}</span>
        <span className="text-ink-600">
          {" "}
          · {REVIEWER_TYPE_LABEL[review.reviewerType]} · {formatDate(review.createdAt)}
        </span>
      </figcaption>
    </figure>
  );
}
