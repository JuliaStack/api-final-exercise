import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import playwright from "eslint-plugin-playwright";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Playwright rules only for the test suite: missing await, test.only, etc.
    files: ["tests/**/*.ts"],
    ...playwright.configs["flat/recommended"],
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      // Playwright fixtures call `use(...)`, which is not React's `use` hook.
      "react-hooks/rules-of-hooks": "off",
      // Style only; the specs keep steps without blank lines between them.
      "playwright/consistent-spacing-between-blocks": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    "src/generated/**",
    "playwright-report/**",
    "test-results/**",
    // One-off maintenance scripts (CommonJS).
    "scratch/**",
  ]),
]);
