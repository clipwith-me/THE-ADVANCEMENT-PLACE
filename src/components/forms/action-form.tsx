"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/server/action-state";
import { Alert } from "../ui/alert";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "../ui/button";

type Action = (prev: FormState, data: FormData) => Promise<FormState>;

const FormStateContext = createContext<FormState>({ status: "idle" });
export const useFormState = () => useContext(FormStateContext);

/**
 * Wraps a server action with React's useActionState and shares the result
 * with nested fields via context, so server components can compose forms
 * from <TextField> etc. while errors and echoed values flow back
 * automatically. Shows an accessible error summary that receives focus.
 */
export function ActionForm({
  action,
  children,
  className = "",
  showSuccess = true,
  refreshOnSuccess = false,
  resetOnSuccess = false,
  id,
  "aria-label": ariaLabel,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  showSuccess?: boolean;
  /** Re-render server components after success (e.g. list pages). */
  refreshOnSuccess?: boolean;
  resetOnSuccess?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as FormState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
    if (state.status === "success") {
      if (refreshOnSuccess) router.refresh();
      if (resetOnSuccess) formRef.current?.reset();
    }
  }, [state.at, state.status, refreshOnSuccess, resetOnSuccess, router]);

  const fieldErrors = Object.entries(state.fieldErrors ?? {}).filter(([k]) => k !== "_form");

  return (
    <FormStateContext.Provider value={state}>
      <form ref={formRef} action={formAction} className={className} noValidate id={id} aria-label={ariaLabel}>
        <div ref={summaryRef} tabIndex={-1} className="outline-none" aria-live="polite">
          {state.status === "error" && (
            <Alert tone="danger" title={state.message ?? "Please check the form."} className="mb-5" live>
              {fieldErrors.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {fieldErrors.map(([name, msgs]) => (
                    <li key={name}>
                      <a href={`#field-${name}`}>{msgs[0]}</a>
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
          {state.status === "success" && showSuccess && state.message && (
            <Alert tone="success" title={state.message} className="mb-5" live />
          )}
        </div>
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  size = "md",
  className = "",
  name,
  value,
  formNoValidate,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
  formNoValidate?: boolean;
}) {
  const { pending, data } = useFormStatus();
  // With several submit buttons (e.g. "Save draft" / "Publish"), only the
  // clicked one shows the pending label.
  const isThis = pending && (!name || data?.get(name) === value);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formNoValidate={formNoValidate}
      disabled={pending}
      aria-disabled={pending}
      className={buttonClasses(variant, size, className)}
    >
      {isThis && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {isThis ? pendingLabel : children}
    </button>
  );
}
