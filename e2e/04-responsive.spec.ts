import { expect, test } from "@playwright/test";
import { hasHorizontalOverflow } from "./fixtures";

test("mobile navigation opens, is keyboard-dismissable and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
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
