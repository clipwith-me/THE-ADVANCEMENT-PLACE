/**
 * Email diagnostics for production (run in the host's shell):
 *
 *   npm run email:test -- --to you@example.com
 *
 * Prints the SMTP settings in use (never the password), checks the
 * connection and login, sends one test email, and explains common failures.
 */
import "dotenv/config";
import { env, emailConfigured } from "../src/lib/env";
import { getTransport, smtpErrorDetails } from "../src/server/email/mailer";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function explain(details: Record<string, unknown>): string {
  const code = String(details.code ?? "");
  const rc = Number(details.responseCode ?? 0);
  if (code === "EAUTH" || rc === 535) return "Login rejected: SMTP_USER must be the Brevo SMTP *login* (…@smtp-brevo.com) and SMTP_PASSWORD the SMTP *key* (not your Brevo account password).";
  if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "EDNS"].includes(code)) return "Couldn't reach the SMTP server. Check SMTP_HOST, and try SMTP_PORT=2525 (some hosts block 587).";
  if (code === "EENVELOPE" || rc === 550 || rc === 553) return "Sender or recipient refused: the EMAIL_FROM address must be a verified sender in Brevo (Senders, Domains & Dedicated IPs).";
  if (rc === 421 || rc === 451 || rc === 454) return "Temporarily refused by Brevo. A new Brevo account may still be under review — check your Brevo dashboard/email.";
  return "See the SMTP response above.";
}

async function main() {
  const to = arg("to");
  if (!to) throw new Error("Usage: npm run email:test -- --to you@example.com");
  const e = env();
  console.log("SMTP settings in use:");
  console.log(`  SMTP_HOST     ${e.SMTP_HOST ?? "(not set)"}`);
  console.log(`  SMTP_PORT     ${e.SMTP_PORT}`);
  console.log(`  SMTP_SECURE   ${e.SMTP_SECURE}`);
  console.log(`  SMTP_USER     ${e.SMTP_USER ? e.SMTP_USER : "(not set)"}`);
  console.log(`  SMTP_PASSWORD ${e.SMTP_PASSWORD ? `set (${e.SMTP_PASSWORD.length} characters)` : "(not set)"}`);
  console.log(`  EMAIL_FROM    ${e.EMAIL_FROM}`);
  if (!emailConfigured()) {
    console.log("\n✗ SMTP_HOST is not set, so the site isn't sending email. Add the SMTP variables in the host's environment settings and redeploy.");
    process.exitCode = 1;
    return;
  }
  if (e.SMTP_PORT === 465 && !e.SMTP_SECURE) console.log("\n! Port 465 needs SMTP_SECURE=true.");
  if (e.SMTP_PORT !== 465 && e.SMTP_SECURE) console.log("\n! SMTP_SECURE=true only works with port 465; use false for 587/2525.");

  const transport = getTransport();
  try {
    console.log("\n1. Connecting and logging in…");
    await transport.verify();
    console.log("   ✓ Connected and logged in");
    console.log(`2. Sending a test email to ${to}…`);
    const info = await transport.sendMail({
      from: e.EMAIL_FROM,
      to,
      subject: "Test email from The Advancement Place website",
      text: "If you can read this, the website can send email. You can delete this message.",
    });
    console.log(`   ✓ Accepted by the SMTP server (${info.response})`);
    console.log("\nCheck the inbox and the Spam folder. If it's not there in a few minutes, open Brevo → Transactional → Logs to see what happened to it.");
  } catch (error) {
    const details = smtpErrorDetails(error);
    console.log(`   ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`   SMTP details: ${JSON.stringify(details)}`);
    console.log(`\nLikely cause: ${explain(details)}`);
    process.exitCode = 1;
  } finally {
    transport.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
