import { BriefcaseBusiness, Compass, Handshake, MapPin } from "lucide-react";
import { ContactCard } from "@/components/site/contact-card";
import { FullLogo } from "@/components/site/logo";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { BUSINESS } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Us",
  description: "The Advancement Place is a recruitment and career services business based in Abeokuta, Ogun State, Nigeria.",
  path: "/about",
});

const services = [
  {
    icon: BriefcaseBusiness,
    title: "Job vacancies & recruitment",
    body: "We publish vacancies and manage applications, so candidates can apply with a complete professional profile.",
  },
  {
    icon: Compass,
    title: "Career & job-placement assistance",
    body: "We support graduates and job seekers who want guidance on the next step in their careers.",
  },
  {
    icon: Handshake,
    title: "Freelance & outsourcing enquiries",
    body: "We receive freelance enquiries, outsourcing requests and project proposals by email and through our website.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow={`About ${BUSINESS.name}`} title="Helping people take the next step in their careers">
        {BUSINESS.name} is a recruitment and career services business based in Abeokuta, Ogun State. We connect candidates with job
        opportunities and support people as they build their careers.
      </PageHero>

      <section className="container-page grid gap-12 py-14 lg:grid-cols-12" aria-labelledby="what-heading">
        <div className="lg:col-span-7">
          <h2 id="what-heading" className="font-display text-3xl font-semibold tracking-tight">
            What we do
          </h2>
          <ul className="mt-8 space-y-6">
            {services.map((s) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <s.icon aria-hidden className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">{s.title}</h3>
                  <p className="mt-1 text-ink-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mt-14 font-display text-3xl font-semibold tracking-tight">How we work with candidates</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-ink-700">
            <p>
              Every candidate creates their own account and completes a professional profile before applying. This helps our team review
              applications fairly and consistently, and means you only have to enter your details once.
            </p>
            <p>
              Your CV is stored privately. It is only available to you and to our authorised recruitment staff, and it is never published
              on the website.
            </p>
            <p>
              You can follow the status of each application from your dashboard, update your profile at any time, and delete your account
              if you no longer want to use the service.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Contact us
            </ButtonLink>
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="flex justify-center rounded-2xl border border-ink-200 bg-gradient-to-br from-brand-50 to-white p-10">
            <FullLogo className="h-48 w-auto" />
          </div>
          <div className="flex gap-3 rounded-lg border border-ink-200 p-5">
            <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <p className="text-sm text-ink-700">
              Visit us at Metroeyes Building, opposite Access Bank, Jide Jones Road, Oke-Ilewo, Abeokuta. We&apos;re open Monday to Friday, 8:00 AM to 5:00 PM.
            </p>
          </div>
          <ContactCard />
        </aside>
      </section>
    </>
  );
}
