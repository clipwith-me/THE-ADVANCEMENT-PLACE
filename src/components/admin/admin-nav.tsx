"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Handshake,
  History,
  ImageIcon,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Mail,
  Menu,
  Settings,
  Star,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

type Counts = { career?: number; outsourcing?: number; contact?: number; review?: number; pendingReviews?: number };

const sections = (c: Counts) => [
  {
    title: "Recruitment",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
      { href: "/admin/applications", label: "Applications", icon: FileText, badge: c.review },
      { href: "/admin/candidates", label: "Candidates", icon: Users },
    ],
  },
  {
    title: "Enquiries",
    items: [
      { href: "/admin/enquiries/career", label: "Career assistance", icon: Lightbulb, badge: c.career },
      { href: "/admin/enquiries/outsourcing", label: "Freelance & outsourcing", icon: Handshake, badge: c.outsourcing },
      { href: "/admin/enquiries/contact", label: "Contact", icon: Mail, badge: c.contact },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star, badge: c.pendingReviews },
      { href: "/admin/site-photos", label: "Website photos", icon: ImageIcon },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/team", label: "Staff", icon: UserCog },
      { href: "/admin/activity", label: "Activity log", icon: History },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavBody({ counts, name }: { counts: Counts; name: string }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections(counts).map((s) => (
          <div key={s.title}>
            <p className="px-3 text-[0.7rem] font-semibold tracking-wider text-ink-400 uppercase">{s.title}</p>
            <ul className="mt-2 space-y-0.5">
              {s.items.map(({ href, label, icon: Icon, exact, badge }) => {
                const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                        active ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon aria-hidden className={`size-4 ${active ? "text-brand-300" : ""}`} />
                      <span className="flex-1">{label}</span>
                      {badge ? (
                        <span className="rounded-full bg-brand-400 px-2 py-0.5 text-xs font-semibold text-ink-950">
                          {badge}
                          <span className="sr-only"> new</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-ink-300 hover:bg-white/5 hover:text-white">
          <ExternalLink aria-hidden className="size-4" /> View website
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-300 hover:bg-white/5 hover:text-white">
            <LogOut aria-hidden className="size-4" /> Sign out
          </button>
        </form>
        <p className="mt-2 truncate px-3 text-xs text-ink-500">Signed in as {name}</p>
      </div>
    </div>
  );
}

export function AdminSidebar({ counts, name }: { counts: Counts; name: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink-950 lg:flex">
      <Brand />
      <NavBody counts={counts} name={name} />
    </aside>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
      <span className="font-display text-base font-semibold text-white">The Advancement Place</span>
      <span className="rounded bg-brand-400 px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-ink-950 uppercase">Admin</span>
    </div>
  );
}

export function AdminMobileBar({ counts, name }: { counts: Counts; name: string }) {
  const pathname = usePathname();
  // Remember which page the menu was opened on: navigating closes it with no effect needed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink-950 px-3">
        <span className="font-display text-sm font-semibold text-white">TAP Admin</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-11 place-items-center rounded-md text-white hover:bg-white/10"
          aria-label="Open admin menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin menu" id="admin-drawer">
          <button type="button" className="absolute inset-0 bg-ink-950/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink-950">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-md text-white hover:bg-white/10"
                aria-label="Close admin menu"
                autoFocus
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <NavBody counts={counts} name={name} />
          </div>
        </div>
      )}
    </div>
  );
}
