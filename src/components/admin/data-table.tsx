import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on the mobile card layout (e.g. secondary info already in the title). */
  hideOnMobile?: boolean;
}

/**
 * A real <table> from md upwards; below that each row becomes a stacked
 * card with label/value pairs, so nothing scrolls horizontally on phones.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  primary,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  caption: string;
  /** Rendered as the heading of each mobile card. */
  primary: (row: T) => ReactNode;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-ink-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-ink-200 bg-ink-50 text-xs font-semibold tracking-wide text-ink-600 uppercase">
            <tr>
              {columns.map((c) => (
                <th key={c.header} scope="col" className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={rowKey(r)} className="hover:bg-ink-50/60">
                {columns.map((c) => (
                  <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={rowKey(r)} className="rounded-lg border border-ink-200 bg-white p-4">
            <div className="font-semibold text-ink-900">{primary(r)}</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {columns
                .filter((c) => !c.hideOnMobile)
                .map((c) => (
                  <div key={c.header} className="min-w-0">
                    <dt className="text-xs text-ink-500">{c.header}</dt>
                    <dd className="mt-0.5 min-w-0 break-words text-ink-800">{c.cell(r)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/** GET filter bar shared by admin list pages. */
export function FilterBar({ action, children }: { action: string; children: ReactNode }) {
  return (
    <form action={action} method="get" role="search" className="mb-5 flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-3 sm:flex-row sm:items-end">
      {children}
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-md bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800">
        Apply
      </button>
    </form>
  );
}

export function FilterInput({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="flex-1 text-sm">
      <span className="mb-1 block text-xs font-medium text-ink-600">{label}</span>
      <input
        name={name}
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={100}
        className="block min-h-10 w-full rounded-md border border-ink-300 px-3 text-base sm:text-sm"
      />
    </label>
  );
}

export function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="text-sm sm:w-52">
      <span className="mb-1 block text-xs font-medium text-ink-600">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="block min-h-10 w-full rounded-md border border-ink-300 bg-white px-2 text-base sm:text-sm">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
