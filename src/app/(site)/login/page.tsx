import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { PasswordField, TextField } from "@/components/forms/fields";
import { AuthShell } from "@/components/site/auth-shell";
import { Alert } from "@/components/ui/alert";
import { safeNextPath } from "@/lib/domain/redirect";
import { pageMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/server/auth/current";
import { loginAction } from "../../actions/auth";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to your The Advancement Place candidate account.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : safeNextPath(next, "/account"));
  const safeNext = safeNextPath(next, "");

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your profile and applications."
      footer={
        <>
          New here?{" "}
          <Link href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : "/register"} className="link">
            Create a candidate account
          </Link>
        </>
      }
    >
      {reset && (
        <Alert tone="success" title="Password updated" className="mb-6">
          Sign in with your new password.
        </Alert>
      )}
      {safeNext && !reset && (
        <Alert tone="info" className="mb-6">
          Please sign in to continue.
        </Alert>
      )}
      <ActionForm action={loginAction} className="space-y-5" aria-label="Sign in">
        {safeNext && <input type="hidden" name="next" value={safeNext} />}
        <TextField name="email" label="Email address" type="email" required autoComplete="email" inputMode="email" />
        <PasswordField name="password" label="Password" />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Forgot your password?
          </Link>
        </div>
        <SubmitButton size="lg" className="w-full" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
