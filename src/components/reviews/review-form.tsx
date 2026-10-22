"use client";

import Link from "next/link";
import { submitReviewAction } from "@/app/actions/reviews";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField, Honeypot, RatingField, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { REVIEWER_TYPES, REVIEWER_TYPE_LABEL } from "@/lib/domain/labels";

export function ReviewForm() {
  return (
    <ActionForm action={submitReviewAction} className="relative grid gap-5 sm:grid-cols-2" aria-label="Leave a review">
      <Honeypot />
      <RatingField name="rating" label="Your rating" required className="sm:col-span-2" />
      <TextField name="name" label="Your name" required autoComplete="name" maxLength={80} hint="We show your first name and last initial only." />
      <TextField name="email" label="Email address" type="email" required autoComplete="email" hint="Never shown. Lets us confirm the review is genuine." />
      <SelectField
        name="reviewerType"
        label="You are a…"
        required
        className="sm:col-span-2"
        options={REVIEWER_TYPES.map((t) => ({ value: t, label: REVIEWER_TYPE_LABEL[t] }))}
      />
      <TextAreaField name="comment" label="Your review" required rows={5} maxLength={1000} className="sm:col-span-2" hint="20–1,000 characters. Tell others about your experience with us." />
      <CheckboxField
        name="consent"
        required
        className="sm:col-span-2"
        label={
          <>
            I agree that The Advancement Place may publish my review with my first name and last initial, as described in the{" "}
            <Link href="/privacy" className="link">
              Privacy Policy
            </Link>
            .
          </>
        }
      />
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Sending…">Submit review</SubmitButton>
        <p className="mt-2 text-xs text-ink-600">Reviews appear on the website after our team has checked them.</p>
      </div>
    </ActionForm>
  );
}
