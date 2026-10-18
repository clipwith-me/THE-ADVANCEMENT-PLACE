"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, FileUser, LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const items = [
  // `short` keeps labels on one line in the two-column phone grid.
  { href: "/account", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/profile", label: "My profile & CV", short: "My profile", icon: FileUser },
  { href: "/account/applications", label: "My applications", short: "Applications", icon: BriefcaseBusiness },
  { href: "/jobs", label: "Find jobs", short: "Find jobs", icon: Search },
  { href: "/account/settings", label: "Account settings", short: "Settings", icon: Settings },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="mb-4 hidden rounded-lg border border-ink-200 bg-white p-4 lg:block">
        <p className="truncate font-semibold text-ink-900">{name}</p>
        <p className="truncate text-sm text-ink-600">{email}</p>
      </div>
      <nav aria-label="Account">
        {/* Wrapped grid on mobile so every link is visible; vertical list on desktop. */}
        <ul className="grid grid-cols-2 gap-1 rounded-lg border border-ink-200 bg-white p-1 sm:grid-cols-3 lg:flex lg:flex-col lg:border-0 lg:bg-transparent lg:p-0">
          {items.map(({ href, label, short, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors sm:gap-2.5 sm:px-3 ${
                    active ? "bg-brand-50 text-ink-900 ring-1 ring-brand-100 lg:bg-white lg:shadow-xs lg:ring-ink-200" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900 lg:hover:bg-white"
                  }`}
                >
                  <Icon aria-hidden className={`size-4 shrink-0 ${active ? "text-brand-700" : ""}`} />
                  <span className="truncate sm:hidden">{short}</span>
                  <span className="hidden truncate sm:inline">{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 lg:mt-2 lg:border-t lg:border-ink-200 lg:pt-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900 sm:gap-2.5 sm:px-3 lg:hover:bg-white"
              >
                <LogOut aria-hidden className="size-4 shrink-0" /> Sign out
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
