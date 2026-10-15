import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { AuthShell } from "@/components/site/auth-shell";
import { pageMetadata } from "@/lib/seo";
import { forgotPasswordAction } from "../../actions/auth";

export const metadata = pageMetadata({
  title: "Forgot password",
  description: "Request a link to reset your password.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address you registered with and we'll send you a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="link">
            Back to sign in
          </Link>
        </>
      }
    >
      <ActionForm action={forgotPasswordAction} className="space-y-5" aria-label="Request password reset">
        <TextField name="email" label="Email address" type="email" required autoComplete="email" inputMode="email" />
        <SubmitButton size="lg" className="w-full" pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
