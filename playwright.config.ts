import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build (`npm run build` first) and
 * a dedicated, disposable database (E2E_DATABASE_URL — never real data).
 */
const PORT = 3200;
const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgresql://tap:tap@localhost:5432/tap_e2e?schema=public";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Optional: use a pre-installed Chromium instead of Playwright's download.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive|public/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
      DATABASE_URL: E2E_DB,
      APP_URL: `http://localhost:${PORT}`,
      SESSION_SECRET: "e2e-secret-9f8e7d6c5b4a39281706f5e4d3c2b1a0",
      LOG_LEVEL: "warn",
    },
  },
});
