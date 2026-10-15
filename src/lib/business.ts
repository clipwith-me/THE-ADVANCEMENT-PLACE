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
  address: {
    building: "Metroeyes Building",
    street: "Along Oke-Ilewo Road, Jide Jones Road, opposite Access Bank",
    city: "Abeokuta",
    postalCode: "110104",
    state: "Ogun State",
    country: "Nigeria",
  },
  hours: [
    { days: "Monday – Friday", time: "8:00 AM – 5:00 PM" },
    { days: "Saturday – Sunday", time: "Closed" },
  ],
} as const;

export const ADDRESS_ONE_LINE = `${BUSINESS.address.building}, ${BUSINESS.address.street}, ${BUSINESS.address.city} ${BUSINESS.address.postalCode}, ${BUSINESS.address.state}, ${BUSINESS.address.country}`;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${BUSINESS.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telUrl = `tel:${BUSINESS.phoneE164}`;
export const mailtoUrl = (subject?: string) =>
  subject ? `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}` : `mailto:${BUSINESS.email}`;
