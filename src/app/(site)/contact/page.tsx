import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, Honeypot, TextAreaField, TextField } from "@/components/forms/fields";
import { ContactCard } from "@/components/site/contact-card";
import { PageHero } from "@/components/site/page-hero";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";
import { contactAction } from "../../actions/enquiries";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Contact The Advancement Place in Abeokuta, Ogun State by email, phone, WhatsApp or our contact form.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const subject = typeof topic === "string" ? topic.slice(0, 140) : undefined;
  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help">
        Looking to recruit qualified and competent staff for your business? {BUSINESS.name} (TAP) is here to help. Need staff? Contact us
        today using this form to get started.
      </PageHero>
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <section className="card p-5 sm:p-8" aria-labelledby="form-heading">
          <h2 id="form-heading" className="text-xl font-semibold">
            Send us a message
          </h2>
          <p className="mt-1 mb-6 text-sm text-ink-600">Fields marked * are required.</p>
          <ActionForm action={contactAction} className="relative grid gap-5 sm:grid-cols-2" aria-label="Contact form">
            <Honeypot />
            <TextField name="name" label="Your name" required autoComplete="name" maxLength={120} />
            <TextField name="email" label="Email address" type="email" required autoComplete="email" />
            <TextField name="phone" label="Phone number" type="tel" required autoComplete="tel" />
            <TextField name="subject" label="Subject" required defaultValue={subject} maxLength={140} />
            <TextAreaField name="message" label="Message" required rows={6} maxLength={5000} className="sm:col-span-2" />
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
                Send message
              </SubmitButton>
            </div>
          </ActionForm>
        </section>
        <aside>
          <ContactCard subject={subject} />
        </aside>
      </div>
    </>
  );
}
