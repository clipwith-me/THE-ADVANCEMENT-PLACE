import { expect, test } from "@playwright/test";
import { hasHorizontalOverflow, minimalPdf } from "./fixtures";

test.describe("public website", () => {
  test("homepage shows the brand, real business details and live demo vacancies", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find opportunities");
    await expect(page.getByRole("link", { name: /The Advancement Place — home/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently published opportunities" })).toBeVisible();
    await expect(page.getByText("Demo listing").first()).toBeVisible();
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "advancementplace@gmail.com" })).toHaveAttribute("href", "mailto:advancementplace@gmail.com");
    await expect(footer.getByRole("link", { name: /\+234 916 997 5272/ })).toHaveAttribute("href", "tel:+2349169975272");
    await expect(footer.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/2349169975272");
    await expect(footer).toContainText("Metroeyes Building");
    // Draft and expired demo jobs never appear.
    await expect(page.getByText("Office Manager")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Receptionist" })).toHaveCount(0);
  });

  test("sends security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("job board is gated for visitors but job adverts are public", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Sign in to browse the job board" })).toBeVisible();
    await page.goto("/");
    await page.getByRole("link", { name: "Accounts Officer" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Accounts Officer" })).toBeVisible();
    await expect(page.getByText("Demonstration listing")).toBeVisible();
    await expect(page.getByRole("link", { name: /Create account to apply/ })).toBeVisible();
    // Demo jobs are never indexable.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("sitemap and robots exclude private areas and demo jobs", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /account");
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/career-assistance");
    expect(sitemap).not.toContain("/jobs/accounts-officer");
  });

  test("private areas redirect visitors to sign in", async ({ page }) => {
    await page.goto("/account/applications");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fapplications/);
    await page.goto("/admin/jobs");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("custom 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });

  test("contact form validates, then stores the enquiry", async ({ page }) => {
    await page.goto("/contact?topic=Recruitment%20services");
    await expect(page.getByLabel("Subject")).toHaveValue("Recruitment services");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("Please fix the highlighted fields");
    await page.getByLabel("Your name").fill("Tunde Example");
    await page.getByLabel("Email address").fill("tunde@example.test");
    await page.getByLabel("Phone number").fill("0803 555 0101");
    await page.getByRole("textbox", { name: "Message" }).fill("We would like to discuss recruitment support.");
    await page.getByLabel(/I agree that The Advancement Place/).check();
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status").filter({ hasText: "your enquiry has been received" })).toBeVisible();
  });

  test("career assistance enquiry requires a CV, then submits", async ({ page }) => {
    await page.goto("/career-assistance");
    await page.getByLabel("Full name").fill("Ngozi Eze");
    await page.getByLabel("Email address").fill("ngozi@example.test");
    await page.getByLabel("Phone number").fill("08031112222");
    await page.getByLabel("Highest qualification").selectOption("HND");
    await page.getByLabel("Career interests").fill("Banking");
    await page.getByLabel("How can we help?").fill("I would like guidance on entering the banking sector.");
    await page.getByLabel(/I agree that/).check();
    // The browser blocks submission without the CV; the server enforces it too (integration tests).
    await page.getByRole("button", { name: "Submit enquiry" }).click();
    await expect(page.getByRole("status").filter({ hasText: "your enquiry has been received" })).toHaveCount(0);
    await page.getByLabel("Your CV").setInputFiles({ name: "Ngozi CV.pdf", mimeType: "application/pdf", buffer: minimalPdf() });
    await page.getByRole("button", { name: "Submit enquiry" }).click();
    await expect(page.getByRole("status").filter({ hasText: "your enquiry has been received" })).toBeVisible();
  });

  test("outsourcing enquiry submits without the optional attachment", async ({ page }) => {
    await page.goto("/freelance-outsourcing");
    await page.getByLabel("Your name").fill("Firm Example");
    await page.getByLabel("Email address").fill("firm@example.test");
    await page.getByLabel("Phone number").fill("0803 555 0202");
    await page.getByLabel("Type of service").selectOption("Outsourcing a project");
    await page.getByLabel("Project or request description").fill("We need help with a three-month data-entry project.");
    await page.getByLabel(/I agree that/).check();
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByRole("status").filter({ hasText: "your enquiry has been received" })).toBeVisible();
  });

  for (const path of ["/", "/about", "/contact", "/career-assistance", "/freelance-outsourcing", "/register", "/login", "/privacy"]) {
    test(`no horizontal overflow at 320px: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto(path);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
});
