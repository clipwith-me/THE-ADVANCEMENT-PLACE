import { CheckCircle2, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { privateMetadata } from "@/lib/seo";
import { verifyEmail } from "@/server/services/auth-service";

export const metadata = privateMetadata("Verify email");

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = typeof token === "string" ? await verifyEmail(token) : false;
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-lg text-center">
        <span className={`mx-auto grid size-14 place-items-center rounded-full ${ok ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}>
          {ok ? <CheckCircle2 aria-hidden className="size-7" /> : <XCircle aria-hidden className="size-7" />}
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold">{ok ? "Email confirmed" : "This link isn't valid"}</h1>
        <p className="mt-3 text-ink-600">
          {ok
            ? "Thanks — your email address is confirmed."
            : "The confirmation link has expired or was already used. Sign in and request a new link from your dashboard."}
        </p>
        <ButtonLink href="/account" className="mt-8">
          Go to my dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
