import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { PasswordField } from "@/components/forms/fields";
import { AuthShell } from "@/components/site/auth-shell";
import { Alert } from "@/components/ui/alert";
import { privateMetadata } from "@/lib/seo";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { resetPasswordAction } from "../../actions/auth";

export const metadata = privateMetadata("Choose a new password");

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && token.length >= 20 && token.length <= 200;
  return (
    <AuthShell title="Choose a new password" description="For your security, this will sign you out on all other devices.">
      {!valid ? (
        <Alert tone="danger" title="This reset link is incomplete or invalid.">
          <Link href="/forgot-password">Request a new link</Link>.
        </Alert>
      ) : (
        <ActionForm action={resetPasswordAction} className="space-y-5" aria-label="Set new password">
          <input type="hidden" name="token" value={token} />
          <PasswordField
            name="password"
            label="New password"
            autoComplete="new-password"
            hint={`At least ${PASSWORD_MIN} characters, including a letter and a number.`}
          />
          <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
          <SubmitButton size="lg" className="w-full" pendingLabel="Updating…">
            Update password
          </SubmitButton>
          <p className="text-sm text-ink-600">
            Link expired?{" "}
            <Link href="/forgot-password" className="link">
              Request a new one
            </Link>
          </p>
        </ActionForm>
      )}
    </AuthShell>
  );
}
