import nodemailer, { type Transporter } from "nodemailer";
import { env, emailConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface SendResult {
  delivered: boolean;
  reason?: "not_configured" | "send_failed";
}

let transporter: Transporter | undefined;

function getTransport(): Transporter {
  if (transporter) return transporter;
  const e = env();
  transporter = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

/** Test hook: lets integration tests capture outgoing mail. */
type Outbox = EmailMessage[];
const g = globalThis as unknown as { __tapOutbox?: Outbox };
export const testOutbox = (): Outbox => (g.__tapOutbox ??= []);

/**
 * Sends one email. Never throws: callers persist their data first and use the
 * result to report delivery honestly. Without SMTP configuration, development
 * prints the message (so verification/reset links are usable locally) while
 * production logs a warning and reports `delivered: false`.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const e = env();
  if (e.NODE_ENV === "test") {
    testOutbox().push(message);
    return { delivered: true };
  }
  if (!emailConfigured()) {
    if (e.NODE_ENV === "development") {
      console.log(`\n──── [dev email — SMTP not configured] ────\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n────────────────────────────────────────────\n`);
    } else {
      logger.warn("email.not_configured", { subject: message.subject });
    }
    return { delivered: false, reason: "not_configured" };
  }
  try {
    await getTransport().sendMail({
      from: e.EMAIL_FROM,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { delivered: true };
  } catch (error) {
    logger.error("email.send_failed", { subject: message.subject, error });
    return { delivered: false, reason: "send_failed" };
  }
}
