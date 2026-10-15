import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { PasswordField } from "@/components/forms/fields";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/domain/format";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { privateMetadata } from "@/lib/seo";
import { requireCandidate } from "@/server/auth/current";
import { changePasswordAction, deleteAccountAction } from "../../../actions/auth";

export const metadata = privateMetadata("Account settings");

export default async function SettingsPage() {
  const user = await requireCandidate();
  return (
    <>
      <PageHeader title="Account settings" />
      <div className="space-y-6">
        <section className="card p-5 sm:p-6" aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-lg font-semibold">
            Account
          </h2>
          <DefinitionList
            items={[
              ["Email", user.email],
              ["Email confirmed", user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Not yet confirmed"],
            ]}
          />
          <p className="mt-2 text-sm text-ink-600">
            To change your email address, please <Link href="/contact" className="link">contact us</Link>.
          </p>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="password-heading">
          <h2 id="password-heading" className="mb-5 text-lg font-semibold">
            Change password
          </h2>
          <ActionForm action={changePasswordAction} className="max-w-md space-y-5" resetOnSuccess>
            <PasswordField name="currentPassword" label="Current password" />
            <PasswordField
              name="password"
              label="New password"
              autoComplete="new-password"
              hint={`At least ${PASSWORD_MIN} characters, including a letter and a number.`}
            />
            <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
            <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
          </ActionForm>
        </section>

        <section className="rounded-lg border border-danger-700/25 bg-white p-5 sm:p-6" aria-labelledby="delete-heading">
          <h2 id="delete-heading" className="text-lg font-semibold text-danger-700">
            Delete account
          </h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-ink-700">
            Permanently delete your account, profile, CVs and application history. This cannot be undone. See our{" "}
            <Link href="/privacy" className="link">
              Privacy Policy
            </Link>{" "}
            for how we handle your data.
          </p>
          <ConfirmAction
            action={deleteAccountAction}
            trigger={
              <>
                <Trash2 aria-hidden className="size-4" /> Delete my account
              </>
            }
            triggerVariant="danger"
            title="Delete your account permanently?"
            body="All your data, including your CV and applications, will be deleted. Enter your password to confirm."
            confirmLabel="Delete account"
            variant="danger"
          >
            <PasswordField name="password" label="Password" />
          </ConfirmAction>
        </section>
      </div>
    </>
  );
}
