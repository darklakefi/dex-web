import { workspaceRoot } from "@nx/devkit";
import { nxE2EPreset } from "@nx/playwright/preset";
import { defineConfig, devices } from "@playwright/test";
import { join } from "path";

// Configuration constants
const CI_TIMEOUT = 60000; // 1 minute for CI environments
const LOCAL_TIMEOUT = 30000; // 30 seconds for local development
const CI_RETRIES = 2;
const LOCAL_RETRIES = 0;
const CI_WORKERS = 2; // Conservative for CircleCI resource limits

// Environment detection
const isCI = process.env.CI === "true";
const isCIRCLECI = !!process.env.CIRCLECI;

// App configuration
const baseURL =
  process.env.BASE_URL ||
  (isCI ? "http://127.0.0.1:3000" : "http://localhost:4200");

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: "./src" }),
  expect: {
    timeout: 10000,
  },
  forbidOnly: isCI,
  fullyParallel: true,
  outputDir: join(
    workspaceRoot,
    "dist",
    ".playwright",
    "web-e2e",
    "test-results",
  ),

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: isCIRCLECI
          ? {
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
              ],
            }
          : {},
      },
    },
    ...(isCI
      ? [
          {
            name: "firefox",
            use: {
              ...devices["Desktop Firefox"],
              launchOptions: isCIRCLECI
                ? {
                    args: ["--no-sandbox", "--disable-dev-shm-usage"],
                  }
                : {},
            },
          },
          {
            name: "webkit",
            use: {
              ...devices["Desktop Safari"],
              launchOptions: {},
            },
          },
        ]
      : []),
  ],

  reporter: isCI
    ? [
        [
          "html",
          {
            open: "never",
            outputFolder: join(
              workspaceRoot,
              "dist",
              ".playwright",
              "web-e2e",
              "html-report",
            ),
          },
        ],
        [
          "junit",
          {
            outputFile: join(
              workspaceRoot,
              "dist",
              ".playwright",
              "web-e2e",
              "junit.xml",
            ),
          },
        ],
        ["github"],
      ]
    : [["html", { open: "on-failure" }], ["list"]],
  retries: isCI ? CI_RETRIES : LOCAL_RETRIES,

  timeout: isCI ? CI_TIMEOUT : LOCAL_TIMEOUT,
  use: {
    actionTimeout: 15000,
    baseURL,

    headless: isCI,

    navigationTimeout: 30000,
    screenshot: "only-on-failure",
    trace: isCI ? "retain-on-failure" : "on-first-retry",
    video: isCI ? "retain-on-failure" : "on-first-retry",

    viewport: { height: 720, width: 1280 },
  },
  webServer: {
    command: isCI
      ? "pnpm exec nx run web:start -- --hostname 0.0.0.0 --port 3000"
      : "pnpm exec nx run web:serve",
    cwd: workspaceRoot,

    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: isCI ? "production" : "development",
      PORT: "3000",
    },
    reuseExistingServer: !isCI,
    stderr: isCI ? "pipe" : "ignore",

    stdout: isCI ? "pipe" : "ignore",
    timeout: isCI ? 180000 : 60000,

    url: baseURL,
  },
  workers: isCI ? CI_WORKERS : undefined,
});
