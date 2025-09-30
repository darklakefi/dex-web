import { workspaceRoot } from "@nx/devkit";
import { nxE2EPreset } from "@nx/playwright/preset";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: "./e2e" }),
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
  reporter: [
    ["html", { outputFolder: "../../dist/apps/web-e2e/html-report" }],
    ["junit", { outputFile: "../../dist/apps/web-e2e/junit.xml" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx nx serve web --port=3000",
    cwd: workspaceRoot,
    reuseExistingServer: true,
    url: "http://localhost:3000",
    timeout: process.env.CI ? 180000 : 60000,
  },
});
