"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { resendVerificationAction } from "@/app/actions/auth";
import type { FormState } from "@/server/action-state";

export function ResendVerification() {
  const [state, action, pending] = useActionState(resendVerificationAction, { status: "idle" } as FormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center gap-2 font-semibold underline">
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Resend confirmation email
      </button>
      <span role="status" className="text-sm">
        {state.message}
      </span>
    </form>
  );
}
