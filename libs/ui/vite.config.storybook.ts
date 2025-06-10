import path from "node:path";
/// <reference types="vitest" />
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig, mergeConfig } from "vite";
import { config } from "./vite.config";

const dirname = path.resolve(__dirname);
export default mergeConfig(
  { ...config, test: undefined },
  defineConfig({
    plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: "chromium" }],
        provider: "playwright",
      },
    },
  }),
);
