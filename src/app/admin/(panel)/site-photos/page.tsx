import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, ImageIcon, Trash2 } from "lucide-react";
import { SitePhotoUpload } from "@/components/admin/site-photo-upload";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { TextField } from "@/components/forms/fields";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatBytes } from "@/lib/domain/format";
import { requireAdmin } from "@/server/auth/current";
import { listSitePhotosForAdmin } from "@/server/services/site-content-service";
import { updateSitePhotoAction } from "../../actions";

export const metadata = { title: "Website photos" };

export default async function SitePhotosPage() {
  const admin = await requireAdmin();
  const photos = await listSitePhotosForAdmin(admin);
  const shown = photos.filter((p) => p.published).length;

  return (
    <>
      <PageHeader
        title="Website photos"
        description="Photos shown in the “Inside The Advancement Place” section of the About page. Use real photos of your office, team and events."
        actions={
          <a href="/about" target="_blank" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
            View About page <ExternalLink aria-hidden className="size-4" />
          </a>
        }
      />

      <section className="card mb-6 p-5 sm:p-6" aria-labelledby="add-heading">
        <h2 id="add-heading" className="mb-5 text-base font-semibold">
          Add a photo
        </h2>
        <SitePhotoUpload />
      </section>

      {photos.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No photos yet">
          The gallery stays hidden on the About page until you add a photo.
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-600">
            {shown} of {photos.length} shown on the website, in this order.
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((p, i) => (
              <li key={p.id} className={`card overflow-hidden ${p.published ? "" : "opacity-75"}`}>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                  <img src={`/media/${p.fileId}`} alt={p.caption} className="aspect-[4/3] w-full bg-ink-100 object-cover" />
                  <span
                    className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold ${p.published ? "bg-success-700 text-white" : "bg-ink-900 text-white"}`}
                  >
                    {p.published ? "Shown" : "Hidden"}
                  </span>
                </div>
                <div className="space-y-4 p-4">
                  <ActionForm action={updateSitePhotoAction} refreshOnSuccess className="space-y-3" aria-label={`Caption for photo ${i + 1}`}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="op" value="caption" />
                    <TextField id={`caption-${p.id}`} name="caption" label="Caption" required maxLength={160} defaultValue={p.caption} />
                    <SubmitButton size="sm" variant="secondary" pendingLabel="Saving…">
                      Save caption
                    </SubmitButton>
                  </ActionForm>
                  <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                    <OpButton id={p.id} op={p.published ? "hide" : "show"} label={p.published ? "Hide" : "Show"} icon={p.published ? EyeOff : Eye} />
                    {i > 0 && <OpButton id={p.id} op="up" label="Move up" icon={ArrowUp} />}
                    {i < photos.length - 1 && <OpButton id={p.id} op="down" label="Move down" icon={ArrowDown} />}
                    <ConfirmAction
                      action={updateSitePhotoAction}
                      hidden={{ id: p.id, op: "delete" }}
                      trigger={
                        <>
                          <Trash2 aria-hidden className="size-4" /> Delete
                        </>
                      }
                      triggerVariant="ghost"
                      title="Delete this photo?"
                      body="It's removed from the website and deleted permanently. To take it off the site but keep it, use Hide instead."
                      confirmLabel="Delete photo"
                      variant="danger"
                    />
                  </div>
                  <p className="text-xs text-ink-500">{formatBytes(p.file.sizeBytes)} after resizing</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function OpButton({ id, op, label, icon: Icon }: { id: string; op: string; label: string; icon: typeof Eye }) {
  return (
    <ActionForm action={updateSitePhotoAction} refreshOnSuccess aria-label={label}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton size="sm" variant="secondary" pendingLabel="…">
        <Icon aria-hidden className="size-4" /> {label}
      </SubmitButton>
    </ActionForm>
  );
}
