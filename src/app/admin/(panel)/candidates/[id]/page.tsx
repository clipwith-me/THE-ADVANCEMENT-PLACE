import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Download, RotateCcw } from "lucide-react";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { ApplicationStatusBadge, RejectedBadge } from "@/components/ui/status-badge";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { formatBytes, formatDate } from "@/lib/domain/format";
import { NYSC_STATUS_LABEL, QUALIFICATION_LABEL } from "@/lib/domain/labels";
import { isAppError } from "@/lib/errors";
import { requireAdmin } from "@/server/auth/current";
import { getCandidate } from "@/server/services/admin-service";
import { candidateStatusAction } from "../../../actions";

export const metadata = { title: "Candidate" };

const monthYear = new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const c = await getCandidate(admin, id).catch((e) => {
    if (isAppError(e) && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const p = c.profile;

  return (
    <>
      <Link href="/admin/candidates" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft aria-hidden className="size-4" /> Candidates
      </Link>
      <PageHeader
        title={c.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {p?.headline ?? "Experience not added yet"} {c.status === "SUSPENDED" && <RejectedBadge />}
          </span>
        }
        actions={
          c.status === "ACTIVE" ? (
            <ConfirmAction
              action={candidateStatusAction}
              hidden={{ id: c.id, status: "SUSPENDED" }}
              trigger={<><Ban aria-hidden className="size-4" /> Suspend account</>}
              title="Suspend this account?"
              body="The candidate is signed out immediately and can't sign in until reactivated. Their data and applications are kept."
              confirmLabel="Suspend"
              variant="danger"
            />
          ) : (
            <ConfirmAction
              action={candidateStatusAction}
              hidden={{ id: c.id, status: "ACTIVE" }}
              trigger={<><RotateCcw aria-hidden className="size-4" /> Reactivate</>}
              title="Reactivate this account?"
              body="The candidate will be able to sign in again."
              confirmLabel="Reactivate"
            />
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="profile-heading">
          <div className="flex items-center gap-4">
            <Avatar photoId={p?.photo?.id} name={c.name} size="xl" />
            <h2 id="profile-heading" className="text-base font-semibold">
              Profile
              {!p?.photo && <span className="mt-1 block text-sm font-normal text-ink-600">No passport photograph uploaded</span>}
            </h2>
          </div>
          <DefinitionList
            items={[
              ["Email", <a key="e" className="link" href={`mailto:${c.email}`}>{c.email}</a>],
              ["Email confirmed", c.emailVerifiedAt ? formatDate(c.emailVerifiedAt) : "No"],
              ["Phone", p?.phone ? <a className="link" href={`tel:${p.phone}`}>{p.phone}</a> : null],
              ["Location", [p?.city, p?.state].filter(Boolean).join(", ") || null],
              ["Highest qualification", p?.highestQualification ? `${QUALIFICATION_LABEL[p.highestQualification]}${p.qualificationDetail ? ` — ${p.qualificationDetail}` : ""}` : null],
              ["Institution", [p?.institution, p?.courseOfStudy, p?.graduationYear].filter(Boolean).join(" · ") || null],
              ["NYSC status", p?.nyscStatus ? NYSC_STATUS_LABEL[p.nyscStatus] : "Not provided"],
              ["Skills", p?.skills.length ? p.skills.map((s) => s.skill.name).join(", ") : null],
              ["Certifications", p?.certifications ? <span className="whitespace-pre-line">{p.certifications}</span> : null],
              ["LinkedIn", p?.linkedinUrl ? <a className="link break-all" href={p.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow">{p.linkedinUrl}</a> : null],
              ["Portfolio", p?.portfolioUrl ? <a className="link break-all" href={p.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow">{p.portfolioUrl}</a> : null],
              ["About", p?.about ? <span className="whitespace-pre-line">{p.about}</span> : null],
              [
                "Current CV",
                p?.currentCv ? (
                  <a href={`/api/files/${p.currentCv.id}`} className="link inline-flex items-center gap-1.5">
                    <Download aria-hidden className="size-4" /> {p.currentCv.originalName} ({formatBytes(p.currentCv.sizeBytes)})
                  </a>
                ) : null,
              ],
              ["Profile complete", p?.completedAt ? formatDate(p.completedAt) : "Not yet"],
              ["Joined", formatDate(c.createdAt)],
              ["Last sign-in", c.lastLoginAt ? formatDate(c.lastLoginAt) : "—"],
            ]}
          />
        </section>
        <div className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="apps-heading">
            <h2 id="apps-heading" className="text-base font-semibold">
              Applications ({c.applications.length})
            </h2>
            {c.applications.length ? (
              <ul className="mt-3 divide-y divide-ink-100">
                {c.applications.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/applications/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-ink-50">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{a.job.title}</span>
                        <span className="text-xs text-ink-500">{formatDate(a.createdAt)}</span>
                      </span>
                      <ApplicationStatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-600">No applications yet.</p>
            )}
          </section>
          {(p?.education.length || p?.experience.length) ? (
            <section className="card p-5 sm:p-6" aria-labelledby="history-heading">
              <h2 id="history-heading" className="text-base font-semibold">
                Education &amp; employment
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {p?.education.map((e) => (
                  <li key={e.id}>
                    <p className="font-medium">{e.institution}</p>
                    <p className="text-ink-600">
                      {QUALIFICATION_LABEL[e.qualification]}
                      {e.courseOfStudy ? ` · ${e.courseOfStudy}` : ""}
                      {e.endYear ? ` · ${e.endYear}` : ""}
                    </p>
                  </li>
                ))}
                {p?.experience.map((x) => (
                  <li key={x.id}>
                    <p className="font-medium">
                      {x.title} · {x.employer}
                    </p>
                    <p className="text-ink-600">
                      {x.startDate ? monthYear.format(x.startDate) : "—"} – {x.isCurrent ? "Present" : x.endDate ? monthYear.format(x.endDate) : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
