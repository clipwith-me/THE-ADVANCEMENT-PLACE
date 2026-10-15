"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogIn, Menu, UserPlus, X } from "lucide-react";
import { buttonClasses } from "../ui/button";

export function MobileNav({
  items,
  dashboard,
  isAdmin,
}: {
  items: { href: string; label: string }[];
  dashboard: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
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

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="grid size-11 place-items-center rounded-md text-ink-800 hover:bg-ink-100"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
      </button>
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-ink-200 bg-white px-4 pt-4 pb-8 sm:top-[4.5rem]"
      >
        <nav aria-label="Mobile">
          <ul className="divide-y divide-ink-100">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center text-base font-medium ${active ? "text-brand-700" : "text-ink-800"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-6 grid gap-3">
          {dashboard ? (
            <Link href={dashboard} className={buttonClasses("dark", "lg")}>
              <LayoutDashboard aria-hidden className="size-4" /> {isAdmin ? "Admin dashboard" : "My dashboard"}
            </Link>
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
    </div>
  );
}
