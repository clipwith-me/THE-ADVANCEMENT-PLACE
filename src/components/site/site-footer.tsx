import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ADDRESS_ONE_LINE, BUSINESS, mailtoUrl, telUrl, whatsappUrl } from "@/lib/business";
import { SocialIcon } from "../ui/social-icons";
import { LogoMark } from "./logo";

const columns = [
  {
    title: "Candidates",
    links: [
      { href: "/jobs", label: "Find jobs" },
      { href: "/register", label: "Create an account" },
      { href: "/login", label: "Sign in" },
      { href: "/career-assistance", label: "Career assistance" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/freelance-outsourcing", label: "Freelance & outsourcing" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

const legal = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container-page grid gap-8 py-10 sm:gap-10 sm:py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-auto" />
            <p className="font-display text-lg leading-tight font-semibold">{BUSINESS.name}</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
            Recruitment and career services in Abeokuta, Ogun State — connecting candidates with job opportunities across Nigeria.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <address className="not-italic text-ink-700">{ADDRESS_ONE_LINE}</address>
            </li>
            <li className="flex gap-3">
              <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <span className="text-ink-700">
                {BUSINESS.hours.map((h) => (
                  <span key={h.days} className="block">
                    {h.days}: {h.time}
                  </span>
                ))}
              </span>
            </li>
          </ul>
          <ul className="mt-5 flex gap-2" aria-label="Follow us">
            {BUSINESS.social.map((s) => (
              <li key={s.network}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-11 place-items-center rounded-full bg-white text-ink-700 ring-1 ring-ink-200 hover:text-brand-700 hover:ring-brand-300"
                >
                  <SocialIcon network={s.network} />
                  <span className="sr-only">
                    {s.label} (opens in a new tab)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:col-span-5">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink-900">{col.title}</h3>
              <ul className="mt-2 sm:mt-3 sm:space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-ink-600 hover:text-ink-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-ink-200 pt-6 sm:border-0 sm:pt-0 lg:col-span-3">
          <h3 className="text-sm font-semibold text-ink-900">Get in touch</h3>
          <ul className="mt-2 text-sm sm:mt-3 sm:space-y-2">
            <li>
              <a href={mailtoUrl()} className="inline-flex min-h-10 items-center gap-2 text-ink-700 hover:text-brand-700">
                <Mail aria-hidden className="size-4 text-brand-700" /> {BUSINESS.email}
              </a>
            </li>
            <li>
              <a href={telUrl} className="inline-flex min-h-10 items-center gap-2 text-ink-700 hover:text-brand-700">
                <Phone aria-hidden className="size-4 text-brand-700" /> {BUSINESS.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 text-ink-700 hover:text-brand-700"
              >
                <MessageCircle aria-hidden className="size-4 text-brand-700" /> WhatsApp us
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-200">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center hover:text-ink-900 sm:min-h-0">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
