import { Star } from "lucide-react";

/** Read-only star rating with a text equivalent for screen readers. */
export function Stars({ rating, className = "size-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={`${className} ${n <= rating ? "fill-brand-400 text-brand-600" : "fill-transparent text-ink-300"}`} />
      ))}
    </span>
  );
}
