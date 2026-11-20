import { defineConfig } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "tests/dojo-courses/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: process.env.BASE_URL || "http://104.168.59.50/training-api/",
    // Keep the trace of the first retry, so CI failures show requests and responses.
    trace: "on-first-retry",
  },
  reporter: [["html", { open: "never" }]],
});
