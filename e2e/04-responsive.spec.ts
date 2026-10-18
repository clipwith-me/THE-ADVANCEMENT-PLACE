import { expect, test } from "@playwright/test";
import { ADMIN, hasHorizontalOverflow, newEmail, register } from "./fixtures";

test("mobile navigation opens, is keyboard-dismissable and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "Mobile" });
  await expect(menu).toBeVisible();
  // Every item must be on screen, not clipped (regression: only the first item showed).
  for (const name of ["Find Jobs", "Career Assistance", "Freelance & Outsourcing", "About", "Contact"]) {
    await expect(menu.getByRole("link", { name, exact: true })).toBeInViewport();
  }
  await expect(page.getByRole("link", { name: "Create account" }).last()).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Career Assistance" }).click();
  await expect(page).toHaveURL(/\/career-assistance/);
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
});

test("job advert and forms fit small screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.getByRole("link", { name: "Front-End Developer (React)" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

test("signed-in candidates can reach their profile from the mobile menu", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await register(page, newEmail(), "Bola Adeyemi");
  await page.getByRole("button", { name: "Open menu" }).click();
  const profile = page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "My profile & CV" });
  await expect(profile).toBeInViewport();
  await profile.click();
  await expect(page).toHaveURL(/\/account\/profile/);
  await expect(page.getByRole("heading", { name: "Profile & CV" })).toBeVisible();

  // Signed-in pages must fit the phone too (regression: the account menu widened every page).
  await page.setViewportSize({ width: 320, height: 760 });
  for (const path of ["/account", "/account/setup", "/account/profile", "/account/applications", "/account/settings"]) {
    await page.goto(path);
    expect(await hasHorizontalOverflow(page), path).toBe(false);
  }
});

test("admin pages fit small screens", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN.email);
  await page.locator("#field-password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  for (const path of ["/admin", "/admin/jobs", "/admin/jobs/new", "/admin/applications", "/admin/candidates", "/admin/enquiries/contact", "/admin/team", "/admin/settings"]) {
    await page.goto(path);
    expect(await hasHorizontalOverflow(page), path).toBe(false);
  }
});
