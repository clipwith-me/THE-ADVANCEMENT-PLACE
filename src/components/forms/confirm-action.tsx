"use client";

import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { FormState } from "@/server/action-state";
import { buttonClasses, type ButtonVariant } from "../ui/button";

type Action = (prev: FormState, data: FormData) => Promise<FormState>;

/**
 * A button that opens a native <dialog> to confirm a consequential action
 * (archive, close, withdraw, suspend…). The native dialog gives focus
 * trapping, Escape-to-close and inert background for free.
 */
export function ConfirmAction({
  action,
  hidden,
  trigger,
  title,
  body,
  confirmLabel,
  variant = "primary",
  triggerVariant = "secondary",
  triggerClassName = "",
  children,
}: {
  action: Action;
  hidden?: Record<string, string>;
  trigger: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  variant?: ButtonVariant;
  triggerVariant?: ButtonVariant;
  triggerClassName?: string;
  /** Extra fields inside the dialog (e.g. a password confirmation). */
  children?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as FormState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      dialogRef.current?.close();
      router.refresh();
    }
  }, [state.at, state.status, router]);

  return (
    <>
      <button type="button" className={buttonClasses(triggerVariant, "sm", triggerClassName)} onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-ink-200 p-0 shadow-lift backdrop:bg-ink-950/50"
      >
        <form action={formAction} className="p-6">
          {Object.entries(hidden ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning-50 text-warning-700">
              <AlertTriangle aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                {title}
              </h2>
              <div className="mt-1.5 text-sm text-ink-600">{body}</div>
            </div>
          </div>
          {children && <div className="mt-4">{children}</div>}
          {state.status === "error" && (
            <p role="alert" className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {state.fieldErrors ? Object.values(state.fieldErrors)[0]?.[0] : state.message}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClasses("secondary")} onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <button type="submit" className={buttonClasses(variant)} disabled={pending}>
              {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
