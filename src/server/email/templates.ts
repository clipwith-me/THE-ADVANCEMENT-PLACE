import { ADDRESS_ONE_LINE, BUSINESS } from "@/lib/business";
import type { EmailMessage } from "./mailer";

/** Escape untrusted text before it goes into email HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

interface Layout {
  heading: string;
  paragraphs: string[]; // plain text; escaped here
  action?: { label: string; url: string };
  footnote?: string;
}

function render({ heading, paragraphs, action, footnote }: Layout): { html: string; text: string } {
  const p = paragraphs.map((t) => `<p style="margin:0 0 14px;line-height:1.6;color:#33302c">${escapeHtml(t)}</p>`).join("");
  const button = action
    ? `<p style="margin:22px 0"><a href="${escapeHtml(action.url)}" style="background:#c9772f;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(action.label)}</a></p><p style="font-size:13px;color:#6b645c;word-break:break-all">If the button doesn't work, copy this link into your browser:<br>${escapeHtml(action.url)}</p>`
    : "";
  const foot = footnote ? `<p style="font-size:13px;color:#6b645c;margin-top:18px">${escapeHtml(footnote)}</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ee;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;padding:28px 20px"><div style="background:#ffffff;border:1px solid #ebe4da;border-radius:12px;padding:28px"><p style="margin:0 0 18px;font-weight:700;color:#c9772f;letter-spacing:.02em">${BUSINESS.name}</p><h1 style="font-size:20px;margin:0 0 16px;color:#1f1c19">${escapeHtml(heading)}</h1>${p}${button}${foot}</div><p style="font-size:12px;color:#857d73;text-align:center;margin-top:16px">${escapeHtml(BUSINESS.name)} · ${escapeHtml(ADDRESS_ONE_LINE)}</p></div></body></html>`;
  const text = [heading, "", ...paragraphs.flatMap((t) => [t, ""]), action ? `${action.label}: ${action.url}\n` : "", footnote ?? "", "", `— ${BUSINESS.name}`]
    .join("\n")
    .trim();
  return { html, text };
}

export function verificationEmail(to: string, name: string, url: string): EmailMessage {
  return {
    to,
    subject: "Confirm your email address",
    ...render({
      heading: `Welcome, ${name}`,
      paragraphs: ["Please confirm your email address to secure your account. This link expires in 24 hours."],
      action: { label: "Confirm email address", url },
      footnote: "If you didn't create an account, you can ignore this email.",
    }),
  };
}

export function passwordResetEmail(to: string, url: string): EmailMessage {
  return {
    to,
    subject: "Reset your password",
    ...render({
      heading: "Reset your password",
      paragraphs: ["We received a request to reset the password for your account. This link expires in 30 minutes and can be used once."],
      action: { label: "Choose a new password", url },
      footnote: "If you didn't request this, you can ignore this email — your password won't change.",
    }),
  };
}

export function applicationReceivedEmail(to: string, name: string, jobTitle: string, url: string): EmailMessage {
  return {
    to,
    subject: `Application received: ${jobTitle}`,
    ...render({
      heading: `Thanks for applying, ${name}`,
      paragraphs: [
        `We've received your application for “${jobTitle}”.`,
        "Our team reviews every application. You can follow its status from your dashboard at any time.",
      ],
      action: { label: "View my applications", url },
    }),
  };
}

export function applicationStatusEmail(to: string, name: string, jobTitle: string, statusLabel: string, url: string): EmailMessage {
  return {
    to,
    subject: `Update on your application: ${jobTitle}`,
    ...render({
      heading: `Hello ${name}`,
      paragraphs: [`The status of your application for “${jobTitle}” is now: ${statusLabel}.`],
      action: { label: "View application", url },
    }),
  };
}

export function enquiryNotificationEmail(
  to: string,
  kind: string,
  fields: [string, string | undefined | null][],
  adminUrl: string,
  replyTo: string,
): EmailMessage {
  return {
    to,
    replyTo,
    subject: `New ${kind} enquiry`,
    ...render({
      heading: `New ${kind} enquiry`,
      paragraphs: fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      action: { label: "Open in admin dashboard", url: adminUrl },
    }),
  };
}

export function adminInviteEmail(to: string, name: string, invitedBy: string, url: string): EmailMessage {
  return {
    to,
    subject: `You've been added as an administrator of ${BUSINESS.name}`,
    ...render({
      heading: `Welcome, ${name}`,
      paragraphs: [
        `${invitedBy} has given you administrator access to the ${BUSINESS.name} website.`,
        "Choose your password to finish setting up your account. This link expires in 72 hours and can be used once.",
      ],
      action: { label: "Choose your password", url },
      footnote: "If the link has expired, use \u201cForgot your password?\u201d on the sign-in page with this email address.",
    }),
  };
}
