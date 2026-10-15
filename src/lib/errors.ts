/**
 * Domain errors thrown by services. Server actions translate them into
 * user-facing form state; anything else is logged and shown as a generic
 * failure so internals never reach the client.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED",
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const validationError = (message: string, fieldErrors?: Record<string, string[]>) =>
  new AppError(message, "VALIDATION", fieldErrors);
export const unauthenticated = (message = "Please sign in to continue.") => new AppError(message, "UNAUTHENTICATED");
export const forbidden = (message = "You don't have permission to do that.") => new AppError(message, "FORBIDDEN");
export const notFound = (message = "We couldn't find what you were looking for.") => new AppError(message, "NOT_FOUND");
export const conflict = (message: string) => new AppError(message, "CONFLICT");
export const rateLimited = (message = "Too many attempts. Please wait a few minutes and try again.") =>
  new AppError(message, "RATE_LIMITED");

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
