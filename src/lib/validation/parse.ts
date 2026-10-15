import type { z } from "zod";
import { validationError } from "../errors";
import { fieldErrorsOf } from "./common";

/** Parses untrusted input or throws a VALIDATION AppError carrying field errors. */
export function parseOrThrow<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> {
  const r = schema.safeParse(raw);
  if (!r.success) throw validationError("Please fix the highlighted fields.", fieldErrorsOf(r.error));
  return r.data;
}
