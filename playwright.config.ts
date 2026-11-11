import { defineConfig } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "tests/dojo-courses/global-setup.ts",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "http://104.168.59.50/training-api/",
  },
  reporter: [["html", { open: "never" }]],
});
