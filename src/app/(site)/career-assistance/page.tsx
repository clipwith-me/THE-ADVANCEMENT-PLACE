import Link from "next/link";
import { ClipboardList, MessagesSquare, PhoneCall, ShieldCheck } from "lucide-react";
import { qualificationOptions } from "@/components/account/profile-parts";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, FileField, Honeypot, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { ContactCard } from "@/components/site/contact-card";
import { PageHero } from "@/components/site/page-hero";
import { Alert } from "@/components/ui/alert";
import { env } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { careerAssistanceAction } from "../../actions/enquiries";

export const metadata = pageMetadata({
  title: "Career Assistance",
  description: "Career and job-placement assistance for graduates and job seekers. Tell us about your background and career goals.",
  path: "/career-assistance",
});

const steps = [
  { icon: ClipboardList, title: "Tell us about yourself", body: "Share your academic background, career interests and, if you like, your CV." },
  { icon: MessagesSquare, title: "We review your enquiry", body: "Our team reads every enquiry during business hours." },
  { icon: PhoneCall, title: "We get in touch", body: "We'll contact you by email or phone to discuss how we can help and the next steps." },
];

export default function CareerAssistancePage() {
  return (
    <>
      <PageHero eyebrow="Career assistance" title="Support for the next step in your career">
        Whether you&apos;ve just graduated or you&apos;re looking for a change, we offer career and job-placement assistance to help you
        move forward with clarity.
      </PageHero>

      <section className="container-page py-12" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <s.icon aria-hidden className="size-5" />
                </span>
                <span className="text-sm font-semibold text-brand-700">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <Alert tone="info" title="Please note" className="mt-6">
          Career assistance supports your job search, but no service can guarantee employment. We&apos;ll discuss the details of any
          support with you directly before you commit to anything.
        </Alert>
      </section>

      <div className="container-page grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <section className="card p-5 sm:p-8" aria-labelledby="form-heading">
          <h2 id="form-heading" className="text-xl font-semibold">
            Request career assistance
          </h2>
          <p className="mt-1 mb-6 text-sm text-ink-600">
            Fields marked * are required. Looking for jobs instead?{" "}
            <Link href="/register" className="link">
              Create a candidate account
            </Link>
            .
          </p>
          <ActionForm action={careerAssistanceAction} className="relative grid gap-5 sm:grid-cols-2" aria-label="Career assistance enquiry">
            <Honeypot />
            <TextField name="name" label="Full name" required autoComplete="name" maxLength={120} />
            <TextField name="email" label="Email address" type="email" required autoComplete="email" />
            <TextField name="phone" label="Phone number" type="tel" required autoComplete="tel" />
            <SelectField name="qualification" label="Highest qualification" required options={qualificationOptions} />
            <TextField name="courseOfStudy" label="Course of study" optionalLabel maxLength={160} className="sm:col-span-2" />
            <TextField
              name="careerInterests"
              label="Career interests"
              required
              maxLength={500}
              className="sm:col-span-2"
              hint="The fields or roles you're interested in, e.g. banking, administration, software development."
            />
            <TextAreaField name="message" label="How can we help?" required rows={5} maxLength={5000} className="sm:col-span-2" />
            <FileField
              name="attachment"
              label="CV"
              optionalLabel
              className="sm:col-span-2"
              hint={`PDF or Word (.docx), up to ${env().MAX_UPLOAD_MB} MB. Stored privately and only seen by our team.`}
            />
            <CheckboxField
              name="consent"
              required
              className="sm:col-span-2"
              label={
                <>
                  I agree that The Advancement Place may use these details and my CV to respond to this enquiry, as described in the{" "}
                  <Link href="/privacy" className="link">
                    Privacy Policy
                  </Link>
                  .
                </>
              }
            />
            <div className="sm:col-span-2">
              <SubmitButton size="lg" pendingLabel="Sending…">
                Submit enquiry
              </SubmitButton>
            </div>
          </ActionForm>
        </section>
        <aside className="space-y-6">
          <ContactCard subject="Career assistance" title="Prefer to talk?" />
          <div className="flex gap-3 rounded-lg border border-ink-200 bg-ink-50 p-5 text-sm text-ink-700">
            <ShieldCheck aria-hidden className="size-5 shrink-0 text-success-700" />
            Your details and CV are only used to respond to your enquiry and are never published.
          </div>
        </aside>
      </div>
    </>
  );
}
