import { expect, test } from "@playwright/test";
import { completeProfile, logout, newEmail, register } from "./fixtures";

test.describe.configure({ mode: "serial" });

let applicationUrl = "";
let cvDownloadPath = "";

test("candidate journey: register → profile gate → search → apply → track", async ({ page }) => {
  const email = newEmail();
  await register(page, email, "Ada Okafor", "/jobs?type=FULL_TIME");

  // Visiting the board before finishing the profile sends you back to setup.
  await page.goto("/jobs");
  await expect(page).toHaveURL(/\/account\/setup\?next=%2Fjobs/);

  await completeProfile(page);
  // Completing the profile continues to the originally requested board.
  await expect(page).toHaveURL(/\/jobs/);
  await expect(page.getByRole("heading", { name: "Find jobs" })).toBeVisible();

  // Filters combine: keyword + remote arrangement.
  await page.getByRole("searchbox", { name: "Keyword" }).fill("developer");
  await page.getByRole("button", { name: "Search jobs" }).click();
  await expect(page.getByText(/1\s+job found/)).toBeVisible();
  await page.goto("/jobs?q=zzzz-nothing");
  await expect(page.getByRole("heading", { name: "No jobs match your search" })).toBeVisible();

  await page.goto("/jobs?category=accounting-finance");
  await page.getByRole("link", { name: "Accounts Officer" }).click();
  await page.getByLabel(/Message to the recruiter/).fill("I have three years of bookkeeping experience.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Application submitted")).toBeVisible();
  applicationUrl = new URL(page.url()).pathname;
  cvDownloadPath = (await page.getByRole("link", { name: /Ada CV\.pdf/ }).getAttribute("href")) ?? "";
  expect(cvDownloadPath).toMatch(/^\/api\/files\//);

  // The CV downloads for its owner, as an attachment.
  const dl = await page.request.get(cvDownloadPath);
  expect(dl.status()).toBe(200);
  expect(dl.headers()["content-disposition"]).toContain("attachment");
  expect(dl.headers()["cache-control"]).toContain("no-store");

  // Duplicate prevention in the UI: the job now shows the existing application.
  await page.goBack();
  await page.reload();
  await expect(page.getByText(/You applied on/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit application" })).toHaveCount(0);

  await page.goto("/account/applications");
  await expect(page.getByRole("link", { name: /Accounts Officer/ })).toBeVisible();
  await expect(page.getByText("Submitted").first()).toBeVisible();
});

test("another candidate can't see someone else's application or CV", async ({ page }) => {
  await register(page, newEmail(), "Bola Adeyemi");
  const res = await page.goto(applicationUrl);
  expect(res?.status()).toBe(404);
  const dl = await page.request.get(cvDownloadPath);
  expect(dl.status()).toBe(404);
  // Candidates can't reach the admin area.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/access-denied/);
  await logout(page);
  expect((await page.request.get(cvDownloadPath)).status()).toBe(404);
});
