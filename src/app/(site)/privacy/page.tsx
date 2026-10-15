import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { ADDRESS_ONE_LINE, BUSINESS, mailtoUrl } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How The Advancement Place collects, uses, stores and protects your personal information and CV.",
  path: "/privacy",
});

// This policy describes what the software actually does. The client should
// have it reviewed against the Nigeria Data Protection Act 2023 before launch.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      intro={
        <p>
          This policy explains how {BUSINESS.name} (“we”, “us”) collects and uses personal information through {BUSINESS.domain}. We
          process personal data in line with the Nigeria Data Protection Act 2023.
        </p>
      }
      sections={[
        {
          id: "collect",
          title: "Information we collect",
          body: (
            <>
              <p>We only collect information needed for recruitment and to respond to enquiries:</p>
              <ul>
                <li>
                  <strong>Account details:</strong> your name, email address and a securely hashed password (we never store your password
                  itself).
                </li>
                <li>
                  <strong>Candidate profile:</strong> phone number, location, professional headline, qualifications, skills, and optional
                  details you choose to add such as education, employment history, certifications, NYSC status and links.
                </li>
                <li>
                  <strong>CVs and documents</strong> you upload.
                </li>
                <li>
                  <strong>Applications:</strong> the vacancies you apply for, your optional message, and a copy of your profile details and
                  CV at the time you applied.
                </li>
                <li>
                  <strong>Enquiries:</strong> details you submit through our contact, career assistance and freelance/outsourcing forms.
                </li>
                <li>
                  <strong>Security data:</strong> records of sign-ins and administrative actions. For rate limiting, IP addresses are
                  converted to a one-way keyed hash and are not stored in readable form.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "use",
          title: "How we use your information",
          body: (
            <ul>
              <li>To create and secure your account.</li>
              <li>To consider you for vacancies you apply for and to update you on your applications.</li>
              <li>To respond to career assistance, freelance, outsourcing and general enquiries.</li>
              <li>To protect the service against fraud and abuse.</li>
            </ul>
          ),
        },
        {
          id: "sharing",
          title: "Who can see your information",
          body: (
            <>
              <p>
                Your profile, CV and applications are visible only to you and to our authorised recruitment staff. They are never shown on
                public pages or to other candidates.
              </p>
              <p>
                When you apply for a vacancy, we may share your application with the employer for that role as part of the recruitment
                process. We do not sell your personal data.
              </p>
              <p>
                We use service providers to run the website (hosting, database and email delivery). They process data on our behalf only
                to provide those services.
              </p>
            </>
          ),
        },
        {
          id: "storage",
          title: "How we protect your information",
          body: (
            <ul>
              <li>CVs are stored in private storage and can only be downloaded after a permission check.</li>
              <li>Passwords are hashed with Argon2id; sessions use secure, HTTP-only cookies.</li>
              <li>Connections to the website are encrypted with HTTPS.</li>
              <li>Administrative actions are recorded in an audit log.</li>
            </ul>
          ),
        },
        {
          id: "retention",
          title: "How long we keep your information",
          body: (
            <>
              <p>
                We keep your account and profile while your account is active. CVs attached to unsuccessful or withdrawn applications are
                deleted after a retention period (currently 12 months), and enquiry attachments are deleted after the enquiry has been
                resolved for the same period.
              </p>
              <p>You can delete your account at any time from your account settings. This permanently removes your profile, CVs and applications.</p>
            </>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <p>
                You may access, correct or delete your personal data, object to or restrict its processing, and withdraw consent. Most
                changes can be made directly in your{" "}
                <Link href="/account/profile" className="link">
                  profile
                </Link>{" "}
                and{" "}
                <Link href="/account/settings" className="link">
                  account settings
                </Link>
                . For anything else, contact us using the details below. You may also lodge a complaint with the Nigeria Data Protection
                Commission.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              We use a single essential cookie to keep you signed in. We do not use advertising or third-party analytics cookies.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact us",
          body: (
            <p>
              Email{" "}
              <a href={mailtoUrl("Privacy request")} className="link">
                {BUSINESS.email}
              </a>
              , call {BUSINESS.phoneDisplay}, or write to us at {ADDRESS_ONE_LINE}.
            </p>
          ),
        },
      ]}
    />
  );
}
