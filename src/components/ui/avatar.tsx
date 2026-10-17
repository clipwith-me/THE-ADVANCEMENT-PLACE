/**
 * Candidate passport photo, served through the authorised file endpoint
 * (never a public URL). Falls back to initials when no photo exists.
 */
export function Avatar({
  photoId,
  name,
  size = "md",
  className = "",
}: {
  photoId: string | null | undefined;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const dims = { sm: "size-9 text-xs", md: "size-12 text-sm", lg: "size-20 text-xl", xl: "size-32 text-3xl" }[size];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  if (photoId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- private, authorised image; next/image would proxy it
      <img
        src={`/api/files/${photoId}`}
        alt={`Passport photograph of ${name}`}
        className={`${dims} shrink-0 rounded-lg bg-ink-100 object-cover ring-1 ring-ink-200 ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${dims} grid shrink-0 place-items-center rounded-lg bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-100 ${className}`}
    >
      {initials || "?"}
    </span>
  );
}
