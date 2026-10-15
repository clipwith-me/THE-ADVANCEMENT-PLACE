"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, FileUser, LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const items = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/profile", label: "Profile & CV", icon: FileUser },
  { href: "/account/applications", label: "My applications", icon: BriefcaseBusiness },
  { href: "/jobs", label: "Find jobs", icon: Search },
  { href: "/account/settings", label: "Account settings", icon: Settings },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-4 hidden rounded-lg border border-ink-200 bg-white p-4 lg:block">
        <p className="truncate font-semibold text-ink-900">{name}</p>
        <p className="truncate text-sm text-ink-600">{email}</p>
      </div>
      <nav aria-label="Account">
        {/* Horizontal scroller on mobile, vertical list on desktop. */}
        <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-white text-ink-900 shadow-xs ring-1 ring-ink-200" : "text-ink-600 hover:bg-white hover:text-ink-900"
                  }`}
                >
                  <Icon aria-hidden className={`size-4 ${active ? "text-brand-700" : ""}`} />
                  {label}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0 lg:mt-2 lg:border-t lg:border-ink-200 lg:pt-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium whitespace-nowrap text-ink-600 hover:bg-white hover:text-ink-900"
              >
                <LogOut aria-hidden className="size-4" /> Sign out
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
