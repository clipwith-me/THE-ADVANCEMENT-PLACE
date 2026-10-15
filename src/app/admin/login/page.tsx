import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { PasswordField, TextField } from "@/components/forms/fields";
import { LogoMark } from "@/components/site/logo";
import { safeNextPath } from "@/lib/domain/redirect";
import { getCurrentUser } from "@/server/auth/current";
import { adminLoginAction } from "@/app/actions/auth";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  const safeNext = safeNextPath(next, "/admin");

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="rounded-2xl bg-white p-3">
            <LogoMark className="h-14 w-auto" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-white">Administrator sign in</h1>
          <p className="mt-1 text-sm text-ink-400">The Advancement Place staff only</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-lift">
          <ActionForm action={adminLoginAction} className="space-y-5" aria-label="Administrator sign in">
            <input type="hidden" name="next" value={safeNext} />
            <TextField name="email" label="Email address" type="email" required autoComplete="username" />
            <PasswordField name="password" label="Password" />
            <SubmitButton size="lg" className="w-full" variant="dark" pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </ActionForm>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
          <ShieldCheck aria-hidden className="size-4" /> Sign-in attempts are rate-limited and logged.
        </p>
      </div>
    </main>
  );
}
