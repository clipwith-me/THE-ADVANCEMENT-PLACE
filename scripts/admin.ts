/**
 * Administrator provisioning CLI. Public registration can never create an
 * admin; this is the only way to grant the role. There are no default
 * credentials.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name"
 *       Prompts for a password (hidden). For non-interactive deploys, pipe it:
 *       printf '%s' "$PASSWORD" | npm run admin:create -- --email … --name … --password-stdin
 *   npm run admin:grant  -- --email existing@example.com
 *   npm run admin:revoke -- --email someone@example.com
 *   npm run admin:list
 */
import "dotenv/config";
import { createInterface } from "node:readline";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { emailField } from "../src/lib/validation/common";
import { passwordField } from "../src/lib/validation/auth";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function readPassword(prompt: string): Promise<string> {
  if (process.argv.includes("--password-stdin")) {
    const chunks: Buffer[] = [];
    for await (const c of process.stdin) chunks.push(c as Buffer);
    return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
  }
  // Hidden interactive prompt.
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  out._writeToOutput = (s: string) => {
    if (s.includes(prompt)) out.output.write(s);
  };
  const answer = await new Promise<string>((resolve) => rl.question(prompt, resolve));
  rl.close();
  process.stdout.write("\n");
  return answer;
}

function parseEmail(): string {
  const r = emailField.safeParse(arg("email") ?? "");
  if (!r.success) throw new Error("Provide a valid --email");
  return r.data;
}

async function create() {
  const email = parseEmail();
  const name = (arg("name") ?? "").trim();
  if (name.length < 2) throw new Error('Provide --name "Full Name"');
  if (await db.user.findUnique({ where: { email } })) throw new Error("A user with that email exists. Use admin:grant instead.");
  const password = await readPassword("New admin password: ");
  const check = passwordField.safeParse(password);
  if (!check.success) throw new Error(`Weak password: ${check.error.issues[0]?.message}`);
  if (password.length < 14) throw new Error("Admin passwords must be at least 14 characters.");
  const user = await db.user.create({
    data: { email, name, role: "ADMIN", passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
  });
  await db.auditEvent.create({ data: { action: "admin.create_cli", entityType: "User", entityId: user.id } });
  console.log(`Administrator created: ${email}`);
}

async function setRole(role: "ADMIN" | "CANDIDATE") {
  const email = parseEmail();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user with that email.");
  if (role === "CANDIDATE" && user.role === "ADMIN") {
    const admins = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (admins <= 1) throw new Error("Refusing to revoke the last active administrator.");
  }
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { role } }),
    // Role changes take effect immediately: end existing sessions.
    db.session.deleteMany({ where: { userId: user.id } }),
    db.auditEvent.create({ data: { action: role === "ADMIN" ? "admin.grant_cli" : "admin.revoke_cli", entityType: "User", entityId: user.id } }),
  ]);
  console.log(`${email} is now ${role === "ADMIN" ? "an administrator" : "a candidate (admin access revoked)"}.`);
}

async function list() {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true, name: true, status: true, lastLoginAt: true } });
  console.table(admins);
}

const command = process.argv[2];
const run = { create, grant: () => setRole("ADMIN"), revoke: () => setRole("CANDIDATE"), list }[command ?? ""];
if (!run) {
  console.error("Usage: admin.ts <create|grant|revoke|list> [--email …] [--name …]");
  process.exit(1);
}
run()
  .catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
