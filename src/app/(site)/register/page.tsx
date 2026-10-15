import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, Honeypot, PasswordField, TextField } from "@/components/forms/fields";
import { AuthShell } from "@/components/site/auth-shell";
import { safeNextPath } from "@/lib/domain/redirect";
import { pageMetadata } from "@/lib/seo";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { getCurrentUser } from "@/server/auth/current";
import { registerAction } from "../../actions/auth";

export const metadata = pageMetadata({
  title: "Create your candidate account",
  description: "Register with The Advancement Place to build your profile, upload your CV and apply for jobs.",
  path: "/register",
});

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/account");
  const safeNext = safeNextPath(next, "");
  const loginHref = safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login";

  return (
    <AuthShell
      title="Create your account"
      description="Join as a candidate. Next, you'll complete a short profile to unlock the job board."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="link">
            Sign in
          </Link>
        </>
      }
    >
      <ActionForm action={registerAction} className="space-y-5" aria-label="Create account">
        <Honeypot />
        {safeNext && <input type="hidden" name="next" value={safeNext} />}
        <TextField name="name" label="Full name" required autoComplete="name" maxLength={120} />
        <TextField name="email" label="Email address" type="email" required autoComplete="email" inputMode="email" />
        <PasswordField
          name="password"
          label="Password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN} characters, including a letter and a number.`}
        />
        <PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" />
        <CheckboxField
          name="acceptTerms"
          required
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="link" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="link" target="_blank">
                Privacy Policy
              </Link>
              .
            </>
          }
        />
        <SubmitButton size="lg" className="w-full" pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
