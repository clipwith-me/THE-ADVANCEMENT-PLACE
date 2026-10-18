import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ADDRESS_ONE_LINE, BUSINESS, mailtoUrl, telUrl, whatsappUrl } from "@/lib/business";
import { SocialIcon } from "../ui/social-icons";

/** Official contact channels — rendered from the single BUSINESS source. */
export function ContactCard({ subject, title = "Contact us directly" }: { subject?: string; title?: string }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_ONE_LINE)}`;
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <ul className="mt-4 space-y-4 text-sm">
        <li>
          <a href={mailtoUrl(subject)} className="group flex gap-3">
            <Mail aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <span>
              <span className="block font-medium text-ink-900">Email</span>
              <span className="text-ink-700 group-hover:text-brand-700 group-hover:underline">{BUSINESS.email}</span>
            </span>
          </a>
        </li>
        <li>
          <a href={telUrl} className="group flex gap-3">
            <Phone aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <span>
              <span className="block font-medium text-ink-900">Phone</span>
              <span className="text-ink-700 group-hover:text-brand-700 group-hover:underline">{BUSINESS.phoneDisplay}</span>
            </span>
          </a>
        </li>
        <li>
          <a href={whatsappUrl(subject ? `Hello, I'm getting in touch about: ${subject}` : undefined)} target="_blank" rel="noopener noreferrer" className="group flex gap-3">
            <MessageCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <span>
              <span className="block font-medium text-ink-900">WhatsApp</span>
              <span className="text-ink-700 group-hover:text-brand-700 group-hover:underline">Chat with us on WhatsApp</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </span>
          </a>
        </li>
        <li className="flex gap-3">
          <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <span>
            <span className="block font-medium text-ink-900">Office</span>
            <address className="text-ink-700 not-italic">{ADDRESS_ONE_LINE}</address>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-block text-sm">
              Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        </li>
        {BUSINESS.social.map((s) => (
          <li key={s.network}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="group flex gap-3">
              <SocialIcon network={s.network} className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <span>
                <span className="block font-medium text-ink-900">{s.label}</span>
                <span className="text-ink-700 group-hover:text-brand-700 group-hover:underline">{s.handle}</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
          </li>
        ))}
        <li className="flex gap-3">
          <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <span>
            <span className="block font-medium text-ink-900">Opening hours</span>
            {BUSINESS.hours.map((h) => (
              <span key={h.days} className="block text-ink-700">
                {h.days}: {h.time}
              </span>
            ))}
          </span>
        </li>
      </ul>
    </div>
  );
}
