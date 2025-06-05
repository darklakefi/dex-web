import path from "node:path";
/// <reference types="vitest" />
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig, mergeConfig } from "vite";
import { config } from "./vite.config";
const dirname = path.resolve(__dirname);
export default mergeConfig(
  config,
  defineConfig({
    plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
    test: {
      globals: true,
      environment: "jsdom",
      exclude: ["**/node_modules/**", "**/dist/**", "**/.storybook/**"],
    },
  }),
);
