import { devices, type PlaywrightTestConfig } from "@playwright/test";
import { frameworkEnv } from "./env.config.js";

export const frameworkPlaywrightConfig: PlaywrightTestConfig = {
  testDir: "./tests",
  outputDir: "test-results/artifacts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/testng-results.xml" }],
  ],
  use: {
    headless: frameworkEnv.headless,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
};

