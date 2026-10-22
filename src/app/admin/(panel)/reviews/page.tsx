import Link from "next/link";
import { Check, EyeOff, MessageSquareHeart, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Stars } from "@/components/reviews/stars";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/domain/format";
import { REVIEW_STATUSES, REVIEW_STATUS_LABEL, REVIEWER_TYPE_LABEL, type ReviewStatusValue } from "@/lib/domain/labels";
import { reviewerDisplayName } from "@/lib/domain/review";
import { requireAdmin } from "@/server/auth/current";
import { listReviewsForAdmin } from "@/server/services/review-service";
import { moderateReviewAction } from "../../actions";

export const metadata = { title: "Reviews" };

type Params = Record<string, string | string[] | undefined>;

const EMPTY: Record<ReviewStatusValue, string> = {
  PENDING: "No reviews are waiting for approval.",
  APPROVED: "No reviews are published yet.",
  REJECTED: "No hidden reviews.",
};

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const status = REVIEW_STATUSES.includes(params.status as ReviewStatusValue) ? (params.status as ReviewStatusValue) : "PENDING";
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const { items, pageCount, byStatus } = await listReviewsForAdmin(admin, { status, page });

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reviews submitted on the website. Only reviews you publish appear on the site, with the reviewer's first name and last initial."
      />
      <nav aria-label="Review status" className="mb-5 flex flex-wrap gap-2">
        {REVIEW_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "PENDING" ? "/admin/reviews" : `/admin/reviews?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
              s === status ? "bg-ink-900 text-white" : "border border-ink-300 bg-white text-ink-800 hover:bg-ink-50"
            }`}
          >
            {REVIEW_STATUS_LABEL[s]}
            <span className={`rounded-full px-1.5 text-xs ${s === status ? "bg-white/20" : "bg-ink-100"}`}>{byStatus[s] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState icon={MessageSquareHeart} title={EMPTY[status]}>
          New reviews from the website&apos;s Reviews page appear under “{REVIEW_STATUS_LABEL.PENDING}”.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Stars rating={r.rating} className="size-5" />
                  <p className="mt-2 font-semibold text-ink-900">
                    {r.name} <span className="font-normal text-ink-600">· {REVIEWER_TYPE_LABEL[r.reviewerType]}</span>
                  </p>
                  <p className="text-sm text-ink-600">
                    <a href={`mailto:${r.email}`} className="link">
                      {r.email}
                    </a>{" "}
                    · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <p className="text-xs text-ink-500">Shown as “{reviewerDisplayName(r.name)}”</p>
              </div>
              <p className="mt-4 leading-relaxed whitespace-pre-line text-ink-800">{r.comment}</p>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
                {r.status !== "APPROVED" && (
                  <ActionForm action={moderateReviewAction} refreshOnSuccess aria-label={`Publish review by ${r.name}`}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton name="decision" value="approve" size="sm" pendingLabel="Publishing…">
                      <Check aria-hidden className="size-4" /> Publish
                    </SubmitButton>
                  </ActionForm>
                )}
                {r.status !== "REJECTED" && (
                  <ActionForm action={moderateReviewAction} refreshOnSuccess aria-label={`Hide review by ${r.name}`}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton name="decision" value="reject" variant="secondary" size="sm" pendingLabel="Hiding…">
                      <EyeOff aria-hidden className="size-4" /> {r.status === "APPROVED" ? "Unpublish" : "Hide"}
                    </SubmitButton>
                  </ActionForm>
                )}
                <ConfirmAction
                  action={moderateReviewAction}
                  hidden={{ id: r.id, decision: "delete" }}
                  trigger={
                    <>
                      <Trash2 aria-hidden className="size-4" /> Delete
                    </>
                  }
                  triggerVariant="ghost"
                  title="Delete this review permanently?"
                  body="Use this for spam. To keep a review off the website but on record, use Hide instead."
                  confirmLabel="Delete review"
                  variant="danger"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/admin/reviews" params={params} />
    </>
  );
}
