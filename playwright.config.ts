import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const chromePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: { timeout: 6000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "qa-results/playwright-report", open: "never" }]],
  outputDir: "qa-results/playwright-artifacts",
  use: {
    baseURL: process.env.QA_BASE_URL ?? "http://127.0.0.1:3000",
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: chromePath && existsSync(chromePath) ? { executablePath: chromePath } : {},
  },
});
