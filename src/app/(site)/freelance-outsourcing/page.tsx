import Link from "next/link";
import { Briefcase, FolderKanban, Mail, Users } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, FileField, Honeypot, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { ContactCard } from "@/components/site/contact-card";
import { PageHero } from "@/components/site/page-hero";
import { BUSINESS, mailtoUrl } from "@/lib/business";
import { OUTSOURCING_SERVICE_TYPES } from "@/lib/domain/labels";
import { env } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { outsourcingAction } from "../../actions/enquiries";

export const metadata = pageMetadata({
  title: "Freelance & Outsourcing Enquiries",
  description: "Enquire about freelance opportunities, or send outsourcing requests and project proposals to The Advancement Place.",
  path: "/freelance-outsourcing",
});

const offerings = [
  { icon: Briefcase, title: "Freelance opportunities", body: "Ask about freelance work that matches your skills and availability." },
  { icon: FolderKanban, title: "Outsourcing & projects", body: "Send us a project you'd like to outsource or a proposal to discuss." },
  { icon: Users, title: "Staffing support", body: "Talk to us about finding people for a role or project in your organisation." },
];

export default function OutsourcingPage() {
  return (
    <>
      <PageHero eyebrow="Freelance & outsourcing" title="Freelance work, outsourcing and project proposals">
        Tell us what you need. Send an enquiry through the form below or email us at{" "}
        <a href={mailtoUrl("Outsourcing / project proposal")} className="link">
          {BUSINESS.email}
        </a>
        .
      </PageHero>

      <section className="container-page py-12" aria-label="What you can enquire about">
        <ul className="grid gap-5 md:grid-cols-3">
          {offerings.map((o) => (
            <li key={o.title} className="card p-5">
              <o.icon aria-hidden className="size-6 text-brand-700" />
              <h2 className="mt-4 font-semibold">{o.title}</h2>
              <p className="mt-1 text-sm text-ink-600">{o.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm text-ink-600">
          This is an enquiry service: our team reviews each request and follows up with you directly. The website does not handle bidding,
          contracts or payments.
        </p>
      </section>

      <div className="container-page grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <section className="card p-5 sm:p-8" aria-labelledby="form-heading">
          <h2 id="form-heading" className="text-xl font-semibold">
            Send an enquiry
          </h2>
          <p className="mt-1 mb-6 text-sm text-ink-600">Fields marked * are required.</p>
          <ActionForm action={outsourcingAction} className="relative grid gap-5 sm:grid-cols-2" aria-label="Freelance and outsourcing enquiry">
            <Honeypot />
            <TextField name="name" label="Your name" required autoComplete="name" maxLength={120} />
            <TextField name="email" label="Email address" type="email" required autoComplete="email" />
            <TextField name="phone" label="Phone number" type="tel" optionalLabel autoComplete="tel" />
            <TextField name="organization" label="Organisation" optionalLabel autoComplete="organization" maxLength={160} />
            <SelectField name="serviceType" label="Type of service" required options={OUTSOURCING_SERVICE_TYPES} className="sm:col-span-2" />
            <TextAreaField
              name="message"
              label="Project or request description"
              required
              rows={6}
              maxLength={5000}
              className="sm:col-span-2"
              hint="Include the scope, timeline and any skills required."
            />
            <FileField
              name="attachment"
              label="Supporting document"
              optionalLabel
              className="sm:col-span-2"
              hint={`PDF or Word (.docx), up to ${env().MAX_UPLOAD_MB} MB.`}
            />
            <CheckboxField
              name="consent"
              required
              className="sm:col-span-2"
              label={
                <>
                  I agree that The Advancement Place may use these details to respond to my enquiry, as described in the{" "}
                  <Link href="/privacy" className="link">
                    Privacy Policy
                  </Link>
                  .
                </>
              }
            />
            <div className="sm:col-span-2">
              <SubmitButton size="lg" pendingLabel="Sending…">
                Send enquiry
              </SubmitButton>
            </div>
          </ActionForm>
        </section>
        <aside className="space-y-6">
          <ContactCard subject="Freelance / outsourcing enquiry" title="Or contact us directly" />
          <a
            href={mailtoUrl("Project proposal")}
            className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50 p-5 text-sm font-medium text-ink-800 hover:border-brand-300"
          >
            <Mail aria-hidden className="size-5 text-brand-700" /> Email a proposal to {BUSINESS.email}
          </a>
        </aside>
      </div>
    </>
  );
}
