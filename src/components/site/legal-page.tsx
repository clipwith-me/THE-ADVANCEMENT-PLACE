import type { ReactNode } from "react";

/** Readable long-form layout with a table of contents for policy pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <nav aria-label="On this page" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <p className="text-xs font-semibold tracking-wider text-ink-500 uppercase">On this page</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ink-600 hover:text-ink-900">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-600">Last updated: {updated}</p>
        <div className="mt-6 text-lg leading-relaxed text-ink-700">{intro}</div>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
            <h2 className="text-xl font-semibold text-ink-900">{s.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-ink-700 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{s.body}</div>
          </section>
        ))}
      </article>
    </div>
  );
}
