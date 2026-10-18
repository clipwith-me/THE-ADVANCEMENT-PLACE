"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, FileUser, LayoutDashboard, LogIn, LogOut, Menu, UserPlus, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { buttonClasses } from "../ui/button";

const CANDIDATE_LINKS = [
  { href: "/account", label: "My dashboard", icon: LayoutDashboard },
  { href: "/account/profile", label: "My profile & CV", icon: FileUser },
  { href: "/account/applications", label: "My applications", icon: BriefcaseBusiness },
];

export function MobileNav({
  items,
  dashboard,
  isAdmin,
}: {
  items: { href: string; label: string }[];
  dashboard: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  // Remember which page the menu was opened on: navigating closes it with no effect needed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [top, setTop] = useState(64);
  const open = openOn === pathname;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) return setOpenOn(null);
    // The panel sits just below the header, wherever it is (an announcement bar can push it down).
    setTop(Math.max(0, buttonRef.current?.closest("header")?.getBoundingClientRect().bottom ?? 64));
    setOpenOn(pathname);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string, exact = false) => pathname === href || (!exact && pathname.startsWith(`${href}/`));

  // Rendered into <body>: the header's backdrop blur would otherwise become the
  // containing block for this fixed panel and clip it to the header's height.
  const panel = (
    <div
      id="mobile-menu"
      ref={panelRef}
      style={{ top }}
      className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-ink-200 bg-white px-4 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <nav aria-label="Mobile">
        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex min-h-12 items-center text-base font-medium ${isActive(item.href) ? "text-brand-700" : "text-ink-800"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {dashboard && !isAdmin && (
          <>
            <p className="mt-6 text-xs font-semibold tracking-wide text-ink-500 uppercase">My account</p>
            <ul className="mt-1 divide-y divide-ink-100">
              {CANDIDATE_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href, href === "/account") ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 text-base font-medium ${isActive(href, href === "/account") ? "text-brand-700" : "text-ink-800"}`}
                  >
                    <Icon aria-hidden className="size-5 text-brand-700" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
      <div className="mt-6 grid gap-3">
        {dashboard ? (
          <>
            {isAdmin && (
              <Link href={dashboard} className={buttonClasses("dark", "lg")}>
                <LayoutDashboard aria-hidden className="size-4" /> Admin dashboard
              </Link>
            )}
            <form action={logoutAction}>
              <button type="submit" className={`${buttonClasses("secondary", "lg")} w-full`}>
                <LogOut aria-hidden className="size-4" /> Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/register" className={buttonClasses("primary", "lg")}>
              <UserPlus aria-hidden className="size-4" /> Create account
            </Link>
            <Link href="/login" className={buttonClasses("secondary", "lg")}>
              <LogIn aria-hidden className="size-4" /> Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="grid size-11 place-items-center rounded-md text-ink-800 hover:bg-ink-100"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={toggle}
      >
        {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
      </button>
      {open && createPortal(panel, document.body)}
    </div>
  );
}
