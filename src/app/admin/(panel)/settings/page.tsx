import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, PasswordField, TextField } from "@/components/forms/fields";
import { Alert } from "@/components/ui/alert";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { ADDRESS_ONE_LINE, BUSINESS } from "@/lib/business";
import { emailConfigured, env } from "@/lib/env";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { requireAdmin } from "@/server/auth/current";
import { getSettings } from "@/server/services/settings-service";
import { changePasswordAction } from "@/app/actions/auth";
import { settingsAction } from "../../actions";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const s = await getSettings();
  const e = env();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="site-heading">
          <h2 id="site-heading" className="text-base font-semibold">
            Site settings
          </h2>
          <ActionForm action={settingsAction} className="mt-5 space-y-5">
            <CheckboxField
              name="publicJobPreview"
              defaultChecked={s.publicJobPreview}
              label="Show job adverts publicly"
              hint="When on, individual job pages are visible to visitors and search engines (applying still needs a complete profile). When off, only signed-in users can view them."
            />
            <CheckboxField
              name="requireCvForProfile"
              defaultChecked={s.requireCvForProfile}
              label="Require a CV for a complete profile"
              hint="When on, candidates must upload a CV before they can browse the job board and apply."
            />
            <CheckboxField
              name="applicationsOpen"
              defaultChecked={s.applicationsOpen}
              label="Accept applications"
              hint="Turn off to pause all new applications temporarily."
            />
            <TextField
              name="announcement"
              label="Site announcement banner"
              optionalLabel
              defaultValue={s.announcement}
              maxLength={240}
              hint="Shown at the top of every public page. Leave empty to hide."
            />
            <SubmitButton>Save settings</SubmitButton>
          </ActionForm>
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="config-heading">
            <h2 id="config-heading" className="text-base font-semibold">
              Configuration status
            </h2>
            {!emailConfigured() && (
              <Alert tone="warning" className="mt-4" title="Email is not configured">
                Verification, password-reset and notification emails are not being sent. Set the SMTP_* environment variables.
              </Alert>
            )}
            <DefinitionList
              items={[
                ["Email sending", emailConfigured() ? "Configured" : "Not configured"],
                ["Notifications sent to", e.NOTIFY_EMAIL],
                ["Email verification required", e.REQUIRE_EMAIL_VERIFICATION ? "Yes" : "No"],
                ["Maximum upload size", `${e.MAX_UPLOAD_MB} MB`],
                ["Document retention", `${e.RETENTION_DAYS} days`],
                ["Business contact details", `${BUSINESS.email} · ${BUSINESS.phoneDisplay} · ${ADDRESS_ONE_LINE}`],
              ]}
            />
            <p className="mt-3 text-xs text-ink-500">These values are set by the developer in the hosting environment and in code.</p>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="text-base font-semibold">
              Your admin account
            </h2>
            <DefinitionList
              items={[
                ["Name", admin.name],
                ["Email", admin.email],
              ]}
            />
            <h3 className="mt-6 text-sm font-semibold">Change password</h3>
            <ActionForm action={changePasswordAction} className="mt-4 space-y-4" resetOnSuccess>
              <PasswordField name="currentPassword" label="Current password" />
              <PasswordField name="password" label="New password" autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters, including a letter and a number.`} />
              <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
              <SubmitButton variant="secondary">Update password</SubmitButton>
            </ActionForm>
          </section>
        </div>
      </div>
    </>
  );
}
