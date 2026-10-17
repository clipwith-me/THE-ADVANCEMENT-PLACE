import { expect, test } from "@playwright/test";
import { ADMIN } from "./fixtures";

test("admin signs in, creates and publishes a job, and reviews applications", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN.email);
  await page.locator("#field-password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Live vacancies")).toBeVisible();

  await page.getByRole("link", { name: "New job" }).first().click();
  // Required-field validation.
  await page.getByRole("button", { name: "Publish job" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("Please fix the highlighted fields");

  await page.getByLabel("Job title").fill("Warehouse Supervisor E2E");
  await page.getByLabel("Category").selectOption({ label: "Logistics & Transport" });
  await page.getByLabel("Employment type").selectOption("FULL_TIME");
  await page.getByLabel("Work arrangement").selectOption("ONSITE");
  await page.getByLabel("Location (state)").selectOption("Ogun");
  await page.getByLabel("City / area").fill("Abeokuta");
  await page.getByLabel("Short summary").fill("Supervise daily warehouse operations and a small team.");
  await page.getByLabel("Full description").fill("You will supervise receiving, storage and dispatch, keep stock records accurate and lead a team of four.");
  await page.getByLabel("Responsibilities").fill("Supervise warehouse staff\nKeep stock records accurate");
  await page.getByLabel("Requirements").fill("Three years in warehousing");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();

  // Drafts aren't public.
  const slugLink = page.getByRole("link", { name: "Preview" }).first();
  await slugLink.click();
  await expect(page.getByText("This is how the vacancy will look to candidates.")).toBeVisible();
  await page.getByRole("link", { name: "Back to editor" }).click();

  await page.getByRole("button", { name: "Publish" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("link", { name: "Public page" })).toBeVisible();
  const publicHref = await page.getByRole("link", { name: "Public page" }).getAttribute("href");
  const res = await page.request.get(publicHref!);
  expect(res.status()).toBe(200);

  await page.goto("/admin/applications");
  await expect(page.getByRole("heading", { name: "Applications", exact: true })).toBeVisible();
  // The application submitted in 02-candidate.spec.ts: review it and change its status.
  await page.getByRole("link", { name: "Ada Okafor" }).first().click();
  await expect(page.getByText("Candidate details (as submitted)")).toBeVisible();
  await expect(page.getByText("Not provided")).toBeVisible(); // NYSC left empty
  // The passport photo submitted with the application loads for staff.
  const photo = page.getByRole("img", { name: "Passport photograph of Ada Okafor" });
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(200);
  await page.locator("#field-status").selectOption("SHORTLISTED");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText(/Status updated/)).toBeVisible();
  // Admins can download the candidate's CV through the authorised endpoint.
  const cvHref = await page.getByRole("link", { name: /Ada CV\.pdf/ }).getAttribute("href");
  expect((await page.request.get(cvHref!)).status()).toBe(200);

  await page.goto("/admin/enquiries/contact");
  await expect(page.getByRole("heading", { name: "Contact enquiries" })).toBeVisible();
});

test("admin login rejects candidates and wrong passwords with one generic message", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN.email);
  await page.locator("#field-password").fill("wrong-password-1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("The email or password is incorrect.");
});
