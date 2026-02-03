import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for load tests
 * 
 * Run with: npx playwright test -c playwright.load.config.ts
 */
export default defineConfig({
  testDir: "./tests/load",
  fullyParallel: false, // Load tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for load tests
  workers: 1, // Single worker for load tests
  reporter: [
    ["html", { outputFolder: "playwright-report-load" }],
    ["list"],
  ],
  timeout: 600000, // 10 minute timeout
  use: {
    baseURL: process.env.LOAD_TEST_URL || "http://localhost:3000",
    trace: "on",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "load-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.LOAD_TEST_URL
    ? undefined // Don't start server for remote testing
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 30000,
      },
});
