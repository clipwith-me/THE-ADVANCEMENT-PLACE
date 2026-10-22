import Link from "next/link";
import { FileUser, LayoutDashboard, LogIn } from "lucide-react";
import { getCurrentUser } from "@/server/auth/current";
import { getSettings } from "@/server/services/settings-service";
import { ButtonLink } from "../ui/button";
import { HeaderLogo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export const PRIMARY_NAV = [
  { href: "/jobs", label: "Find Jobs" },
  { href: "/career-assistance", label: "Career Assistance" },
  { href: "/freelance-outsourcing", label: "Freelance & Outsourcing" },
  { href: "/about", label: "About" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const dashboard = user ? (user.role === "ADMIN" ? "/admin" : "/account") : null;

  return (
    <>
      {settings.announcement && (
        <div className="bg-ink-900 px-4 py-2 text-center text-sm text-ink-100">{settings.announcement}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <a
          href="#main"
          className="sr-only rounded-md bg-ink-900 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to main content
        </a>
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          <HeaderLogo />
          <nav aria-label="Primary" className="hidden xl:block">
            <NavLinks items={PRIMARY_NAV} />
          </nav>
          <div className="hidden items-center gap-2 xl:flex">
            {dashboard ? (
              <>
                {user?.role !== "ADMIN" && (
                  <Link
                    href="/account/profile"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-ink-800 hover:bg-ink-100"
                  >
                    <FileUser aria-hidden className="size-4" /> My profile
                  </Link>
                )}
                <ButtonLink href={dashboard} variant="dark">
                  <LayoutDashboard aria-hidden className="size-4" /> {user?.role === "ADMIN" ? "Admin" : "My dashboard"}
                </ButtonLink>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-ink-800 hover:bg-ink-100">
                  <LogIn aria-hidden className="size-4" /> Sign in
                </Link>
                <ButtonLink href="/register">Create account</ButtonLink>
              </>
            )}
          </div>
          <MobileNav items={PRIMARY_NAV} dashboard={dashboard} isAdmin={user?.role === "ADMIN"} />
        </div>
      </header>
    </>
  );
}
