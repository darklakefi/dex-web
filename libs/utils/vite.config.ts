import { resolve } from "node:path";
/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";
import {
  createBaseConfig,
  createLibraryBuildConfig,
} from "../../vite.config.base";

export default defineConfig(() => {
  const baseConfig = createBaseConfig({
    projectName: "utils",
    cacheDir: "../../node_modules/.vite/libs/utils",
    coverageDir: "../../coverage/libs/utils",
    testEnvironment: "jsdom",
  });

  return mergeConfig(baseConfig, {
    plugins: [
      dts({
        tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
        entryRoot: resolve(__dirname, "src"),
      }),
    ],
    build: createLibraryBuildConfig({
      entryPath: resolve(__dirname, "src/index.ts"),
      outputPath: "../../dist/libs/utils",
      name: "utils",
      formats: ["es", "cjs"],
      external: [],
    }),
  });
});
