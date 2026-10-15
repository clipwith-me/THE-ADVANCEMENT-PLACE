import { unstable_rethrow } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { randomToken } from "@/lib/crypto";

/**
 * Uniform result for form server actions (used with React's useActionState).
 * `values` echoes submitted text so a failed submission never wipes the form.
 */
export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
  /** Monotonic marker so the client can react to repeated identical results. */
  at?: number;
}

export const initialFormState: FormState = { status: "idle" };

const SECRET_FIELDS = /password|token/i;

export function echo(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([k]) => !SECRET_FIELDS.test(k)));
}

/**
 * Converts thrown errors to form state. Known domain errors show their
 * message; anything unexpected is logged with a reference ID and the user
 * sees a generic message — no stack traces or internals reach the client.
 */
export function toFormState(error: unknown, values: Record<string, string> = {}, fileField?: string): FormState {
  // Let Next.js control-flow errors (redirect, notFound) propagate.
  unstable_rethrow(error);
  if (isAppError(error)) {
    let fieldErrors = error.fieldErrors;
    // Upload errors are raised under "file"; point them at the form's actual input.
    if (fileField && fieldErrors?.file) {
      const { file, ...rest } = fieldErrors;
      fieldErrors = { ...rest, [fileField]: file };
    }
    return { status: "error", message: error.message, fieldErrors, values: echo(values), at: Date.now() };
  }
  const ref = randomToken(6);
  logger.error("action.unexpected_error", { ref, error });
  return {
    status: "error",
    message: `Something went wrong on our side. Please try again. (Reference: ${ref})`,
    values: echo(values),
    at: Date.now(),
  };
}

export const success = (message: string, values?: Record<string, string>): FormState => ({
  status: "success",
  message,
  values,
  at: Date.now(),
});
