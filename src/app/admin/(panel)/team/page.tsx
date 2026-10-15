import { ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/misc";
import { RejectedBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/domain/format";
import { emailConfigured } from "@/lib/env";
import { requireAdmin } from "@/server/auth/current";
import { listAdmins } from "@/server/services/team-service";
import { adminAccessAction, inviteAdminAction } from "../../actions";

export const metadata = { title: "Staff" };

export default async function TeamPage() {
  const admin = await requireAdmin();
  const admins = await listAdmins(admin);
  return (
    <>
      <PageHeader title="Staff" description="People who can sign in to this dashboard. Add staff here — no developer needed." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="card overflow-hidden" aria-labelledby="staff-heading">
          <h2 id="staff-heading" className="sr-only">
            Administrators
          </h2>
          <ul className="divide-y divide-ink-100">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                    {a.name} {a.id === admin.id && <span className="text-xs font-medium text-ink-500">(you)</span>}
                    {a.status === "SUSPENDED" && <RejectedBadge />}
                  </p>
                  <p className="truncate text-sm text-ink-600">{a.email}</p>
                  <p className="text-xs text-ink-500">Last sign-in: {a.lastLoginAt ? formatDate(a.lastLoginAt) : "never"}</p>
                </div>
                {a.id !== admin.id &&
                  (a.status === "ACTIVE" ? (
                    <ConfirmAction
                      action={adminAccessAction}
                      hidden={{ id: a.id, status: "SUSPENDED" }}
                      trigger={<><ShieldOff aria-hidden className="size-4" /> Remove access</>}
                      title={`Remove ${a.name}'s access?`}
                      body="They are signed out immediately and can't sign in again until access is restored. Their past actions stay in the activity log."
                      confirmLabel="Remove access"
                      variant="danger"
                    />
                  ) : (
                    <ConfirmAction
                      action={adminAccessAction}
                      hidden={{ id: a.id, status: "ACTIVE" }}
                      trigger={<><ShieldCheck aria-hidden className="size-4" /> Restore access</>}
                      title={`Restore ${a.name}'s access?`}
                      body="They will be able to sign in to the dashboard again."
                      confirmLabel="Restore access"
                    />
                  ))}
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5" aria-labelledby="invite-heading">
          <h2 id="invite-heading" className="flex items-center gap-2 text-base font-semibold">
            <UserPlus aria-hidden className="size-4 text-brand-700" /> Add a staff member
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink-600">They get full administrator access and an email to choose their password.</p>
          {!emailConfigured() && (
            <Alert tone="warning" className="mb-4">
              Email isn&apos;t configured, so invitations can&apos;t be emailed. The new person can still set a password with “Forgot your password?”.
            </Alert>
          )}
          <ActionForm action={inviteAdminAction} className="space-y-4" refreshOnSuccess>
            <TextField name="name" label="Full name" required maxLength={120} />
            <TextField name="email" label="Work email" type="email" required />
            <SubmitButton className="w-full" pendingLabel="Adding…">
              Add staff member
            </SubmitButton>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
