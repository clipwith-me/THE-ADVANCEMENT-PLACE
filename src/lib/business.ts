/**
 * Official business details, supplied by the client. Use these constants
 * everywhere instead of retyping them so the site never shows conflicting
 * contact information.
 */
export const BUSINESS = {
  name: "The Advancement Place",
  shortName: "TAP",
  domain: "theadvancementplace.com",
  email: "advancementplace@gmail.com",
  phoneDisplay: "+234 916 997 5272",
  phoneE164: "+2349169975272",
  // wa.me requires the international number with digits only.
  whatsappNumber: "2349169975272",
  // As confirmed by the client (17 Oct 2026).
  address: {
    building: "Metroeyes Building",
    street: "Opposite Access Bank, Jide Jones Road, Oke-Ilewo",
    city: "Abeokuta",
    state: "Ogun State",
    country: "Nigeria",
  },
  hours: [
    { days: "Monday – Friday", time: "8:00 AM – 5:00 PM" },
    { days: "Saturday – Sunday", time: "Closed" },
  ],
} as const;

export const ADDRESS_ONE_LINE = `${BUSINESS.address.building}, ${BUSINESS.address.street}, ${BUSINESS.address.city}, ${BUSINESS.address.state}, ${BUSINESS.address.country}`;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${BUSINESS.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telUrl = `tel:${BUSINESS.phoneE164}`;
export const mailtoUrl = (subject?: string) =>
  subject ? `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}` : `mailto:${BUSINESS.email}`;
