import { ArrowRight } from "lucide-react";
import { CompletenessCard, CoreProfileFields, CurrentCv } from "@/components/account/profile-parts";
import { CvUploadForm } from "@/components/account/cv-upload-form";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { env } from "@/lib/env";
import { safeNextPath } from "@/lib/domain/redirect";
import { REQUIREMENT_LABEL } from "@/lib/domain/profile-completeness";
import { privateMetadata } from "@/lib/seo";
import { requireCandidate } from "@/server/auth/current";
import { getCompleteness } from "@/server/services/profile-service";
import { saveCoreProfileAction } from "../actions";

export const metadata = privateMetadata("Complete your profile");

export default async function ProfileSetupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await requireCandidate();
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "/jobs");
  const { bundle, result } = await getCompleteness(user.id);
  const cv = bundle.profile?.currentCv;
  const needsCv = result.missing.includes("cv");
  const detailsMissing = result.missing.filter((k) => k !== "cv");

  return (
    <>
      <PageHeader
        eyebrow="Profile setup"
        title={result.complete ? "Your profile is complete" : "Complete your profile"}
        description="A complete profile is required to browse the job board and apply. It takes about three minutes."
      />

      {!result.complete && next && (
        <Alert tone="info" title="Finish your profile to continue" className="mb-6">
          Still needed: {result.missing.map((k) => REQUIREMENT_LABEL[k]).join(", ")}.
        </Alert>
      )}

      {result.complete && (
        <Alert tone="success" title="You're ready to apply for jobs." className="mb-6">
          <ButtonLink href={safeNext} size="sm" className="mt-2 !text-white !no-underline">
            Continue <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="step-1">
            <div className="mb-5 flex items-center gap-3">
              <StepNumber n={1} done={detailsMissing.length === 0} />
              <div>
                <h2 id="step-1" className="text-lg font-semibold">
                  Your details
                </h2>
                <p className="text-sm text-ink-600">Fields marked * are required.</p>
              </div>
            </div>
            <ActionForm action={saveCoreProfileAction} aria-label="Profile details">
              <input type="hidden" name="next" value={safeNext} />
              <CoreProfileFields bundle={bundle} />
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
                <span className="text-xs text-ink-600">You can add education, work history and links later.</span>
              </div>
            </ActionForm>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="step-2">
            <div className="mb-5 flex items-center gap-3">
              <StepNumber n={2} done={!needsCv && Boolean(cv)} />
              <div>
                <h2 id="step-2" className="text-lg font-semibold">
                  Your CV
                </h2>
                <p className="text-sm text-ink-600">{needsCv ? "Required to complete your profile." : "You can replace it at any time."}</p>
              </div>
            </div>
            {cv && (
              <div className="mb-5">
                <CurrentCv cv={cv} />
              </div>
            )}
            <CvUploadForm next={safeNext} hasCv={Boolean(cv)} maxMb={env().MAX_UPLOAD_MB} />
          </section>
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <CompletenessCard result={result} />
        </aside>
      </div>
    </>
  );
}

function StepNumber({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-success-700 text-white" : "bg-ink-900 text-white"}`}
      aria-hidden
    >
      {done ? "✓" : n}
    </span>
  );
}
