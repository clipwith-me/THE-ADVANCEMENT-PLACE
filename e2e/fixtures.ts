import { expect, type Page } from "@playwright/test";
import { placeholderPhoto } from "../tests/image-fixtures";

export const ADMIN = { email: "admin@e2e.test", password: "E2E-admin-password-2026" };
export const PASSWORD = "E2e-candidate-pass-1";

export function minimalPdf(): Buffer {
  return Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF", "latin1");
}

let n = 0;
export const newEmail = () => `cand${Date.now()}${++n}@e2e.test`;

export async function register(page: Page, email: string, name = "Ada Okafor", next?: string) {
  await page.goto(next ? `/register?next=${encodeURIComponent(next)}` : "/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.locator("#field-password").fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account\/setup/);
}

export async function completeProfile(page: Page) {
  await page.getByLabel("Phone number").fill("0803 123 4567");
  await page.getByLabel("State of residence").selectOption("Ogun");
  await page.getByLabel("Your experience").fill("Accounting graduate");
  await page.getByLabel("Highest qualification").selectOption("HND");
  await page.getByLabel("Skills").fill("Bookkeeping, Excel");
  // NYSC status deliberately left empty: it must be optional.
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText(/Upload your passport photograph and CV to finish your profile/)).toBeVisible();
  await page.getByLabel("Upload your passport photograph").setInputFiles({ name: "Ada photo.png", mimeType: "image/png", buffer: placeholderPhoto() });
  await page.getByRole("button", { name: "Upload photo" }).click();
  await expect(page.getByRole("img", { name: /^Passport photograph of / })).toBeVisible();
  await page.getByLabel("Upload your CV").setInputFiles({ name: "Ada CV.pdf", mimeType: "application/pdf", buffer: minimalPdf() });
  await page.getByRole("button", { name: "Upload CV" }).click();
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.locator("#field-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}

/** True when the document is wider than the viewport (horizontal scroll). */
export async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}
