import { hash, verify } from "@node-rs/argon2";

// Argon2id with OWASP-recommended baseline parameters (19 MiB, t=2, p=1).
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// A real hash of a random string, used to equalise timing when the account
// doesn't exist so login doesn't reveal which emails are registered.
let dummyHash: Promise<string> | undefined;
export function dummyVerify(password: string): Promise<boolean> {
  dummyHash ??= hash("timing-equaliser-not-a-real-password", OPTIONS);
  return dummyHash.then((h) => verifyPassword(h, password)).then(() => false);
}
