"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                active ? "text-ink-900" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {item.label}
              {active && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-400" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
