import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { BUSINESS, mailtoUrl } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms that apply when you use The Advancement Place website and candidate account.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 2026"
      intro={
        <p>
          These terms apply to your use of {BUSINESS.domain} operated by {BUSINESS.name}. By creating an account or submitting a form, you
          agree to them.
        </p>
      }
      sections={[
        {
          id: "accounts",
          title: "Your account",
          body: (
            <ul>
              <li>You must provide accurate information and keep your profile up to date.</li>
              <li>Each account is for one individual. Keep your password confidential.</li>
              <li>You are responsible for the documents you upload and confirm you have the right to share them.</li>
            </ul>
          ),
        },
        {
          id: "jobs",
          title: "Vacancies and applications",
          body: (
            <>
              <p>
                We take care to publish accurate vacancy information, but details such as salary, requirements and deadlines may change.
                Submitting an application does not guarantee an interview or employment, and application statuses are not job offers.
              </p>
              <p>You may apply for each vacancy once. You can withdraw an application that is still in progress.</p>
            </>
          ),
        },
        {
          id: "services",
          title: "Career assistance, freelance and outsourcing",
          body: (
            <p>
              Enquiries submitted through the website are requests for us to contact you. They do not create a contract. Any service we
              agree to provide will be confirmed with you directly. This website does not process payments.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <ul>
              <li>Do not upload malicious files or content you don&apos;t have the right to share.</li>
              <li>Do not attempt to access other users&apos; information or interfere with the website&apos;s security.</li>
              <li>Do not submit false, misleading or automated applications or enquiries.</li>
            </ul>
          ),
        },
        {
          id: "suspension",
          title: "Suspension",
          body: <p>We may suspend accounts that breach these terms or put other users or the service at risk.</p>,
        },
        {
          id: "privacy",
          title: "Privacy",
          body: (
            <p>
              Our{" "}
              <Link href="/privacy" className="link">
                Privacy Policy
              </Link>{" "}
              explains how we handle your personal data.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Questions about these terms? Email{" "}
              <a href={mailtoUrl("Terms of Service")} className="link">
                {BUSINESS.email}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
