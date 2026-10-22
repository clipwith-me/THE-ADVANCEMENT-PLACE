import { expect, test, type Page } from "@playwright/test";
import { ADMIN, hasHorizontalOverflow } from "./fixtures";
import { placeholderPhoto, solidPng } from "../tests/image-fixtures";

test.describe.configure({ mode: "serial" });

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN.email);
  await page.locator("#field-password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** True once the <img> has actually loaded and decoded. */
const loaded = (page: Page, name: string | RegExp) =>
  page.getByRole("img", { name }).first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);

test("a visitor's review appears only after an admin publishes it", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only (shared data)");
  await page.goto("/reviews");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.locator("form [role=alert]")).toBeVisible();

  await page.getByRole("radio", { name: /4 stars/ }).check({ force: true });
  await page.getByLabel("Your name").fill("Chidinma Okafor");
  await page.getByLabel("Email address").fill("chidinma@example.test");
  await page.getByLabel("You are a…").selectOption("EMPLOYER");
  await page.getByLabel("Your review").fill("They shortlisted strong candidates for our sales role within a week.");
  await page.getByLabel(/may publish my review/).check();
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByRole("status").filter({ hasText: "once our team has checked it" })).toBeVisible();

  // Not public yet.
  await page.goto("/reviews");
  await expect(page.getByText("They shortlisted strong candidates")).toHaveCount(0);

  await adminLogin(page);
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: /Reviews/ }).click();
  await expect(page.getByText("chidinma@example.test")).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).first().click();
  // Published reviews leave the "Awaiting approval" list and move to "Published".
  await expect(page.getByText("chidinma@example.test")).toHaveCount(0);
  await page.getByRole("link", { name: /^Published/ }).click();
  await expect(page.getByText("chidinma@example.test")).toBeVisible();

  await page.goto("/");
  const section = page.locator("section", { has: page.getByRole("heading", { name: "What people say about us" }) });
  await expect(section.getByText("They shortlisted strong candidates")).toBeVisible();
  await expect(section.getByText("Chidinma O.")).toBeVisible();
  await expect(section.getByRole("img", { name: "Rated 4 out of 5" })).toBeVisible();
  await expect(page.getByText("chidinma@example.test")).toHaveCount(0);
});

test("an admin adds a flyer to a job and visitors see it", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only (shared data)");
  await adminLogin(page);
  await page.goto("/admin/jobs");
  await page.getByRole("link", { name: "Front-End Developer (React)" }).first().click();
  await page.getByLabel("Upload flyer").setInputFiles({ name: "Hiring flyer.png", mimeType: "image/png", buffer: solidPng(800, 1000, [163, 86, 26]) });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Current job flyer" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "Front-End Developer (React)" }).first().click();
  await expect(page.getByRole("img", { name: "Flyer for Front-End Developer (React)" })).toBeVisible();
  expect(await loaded(page, "Flyer for Front-End Developer (React)")).toBe(true);
});

test("an admin adds an About-page photo and visitors see it", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only (shared data)");
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: /^Inside The Advancement Place/ })).toHaveCount(0); // hidden until photos exist

  await adminLogin(page);
  await page.goto("/admin/site-photos");
  await page.locator("#field-photo").setInputFiles({ name: "reception.png", mimeType: "image/png", buffer: placeholderPhoto() });
  await page.locator("#field-caption").fill("Our reception at Oke-Ilewo");
  await page.getByRole("button", { name: "Add photo" }).click();
  await expect(page.getByText("Photo added to the About page.")).toBeVisible();

  await page.goto("/about");
  await expect(page.getByRole("heading", { name: /^Inside The Advancement Place/ })).toBeVisible();
  await expect(page.getByText("Our reception at Oke-Ilewo")).toBeVisible();
  expect(await loaded(page, "Our reception at Oke-Ilewo")).toBe(true);
});

test("new pages fit small screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  for (const path of ["/reviews", "/about", "/"]) {
    await page.goto(path);
    expect(await hasHorizontalOverflow(page), path).toBe(false);
  }
});
