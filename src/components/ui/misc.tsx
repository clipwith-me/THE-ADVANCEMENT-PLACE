import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-300 bg-ink-50 px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-white text-brand-700 ring-1 ring-ink-200">
        <Icon aria-hidden className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-sm text-ink-600">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Server-rendered pagination that preserves the current query string. */
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || v === undefined) continue;
      for (const item of Array.isArray(v) ? v : [v]) if (item) q.append(k, item);
    }
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages = pageWindow(page, pageCount);
  const item = "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-2 sm:justify-center">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${item} gap-1 border border-ink-300 bg-white hover:bg-ink-50`} rel="prev">
          <ChevronLeft aria-hidden className="size-4" /> <span>Previous</span>
        </Link>
      ) : (
        <span className={`${item} gap-1 border border-ink-200 text-ink-400`} aria-disabled="true">
          <ChevronLeft aria-hidden className="size-4" /> <span>Previous</span>
        </span>
      )}
      <ul className="hidden items-center gap-1 sm:flex">
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-2 text-ink-500" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${item} ${p === page ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"}`}
              >
                <span className="sr-only">Page </span>
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      <span className="text-sm text-ink-600 sm:hidden">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={`${item} gap-1 border border-ink-300 bg-white hover:bg-ink-50`} rel="next">
          <span>Next</span> <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span className={`${item} gap-1 border border-ink-200 text-ink-400`} aria-disabled="true">
          <span>Next</span> <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </nav>
  );
}

function pageWindow(page: number, count: number): (number | "…")[] {
  const set = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        <span className="font-semibold text-ink-900">{value}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-ink-200"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {description && <div className="mt-1.5 max-w-2xl text-sm text-ink-600 sm:text-base">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DefinitionList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-ink-200">
      {items.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-ink-600">{k}</dt>
          <dd className="text-sm break-words text-ink-900 sm:col-span-2">{v ?? <span className="text-ink-500">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
