/// <reference types='vitest' />
import { join } from "node:path";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

const baseConfig = {
  cacheDir: "../../node_modules/.vite/libs/utils",
  root: __dirname,

  test: {
    coverage: {
      provider: "v8" as const,
      reportsDirectory: "../../coverage/libs/utils",
    },
    deps: {
      web: {
        transformAssets: true,
      },
    },
    environment: "happy-dom",
    globals: true,
    hookTimeout: 30000,
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    name: "utils",
    outputFile: "./test-results/test-output.json",
    pool: "forks" as const,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    reporters: ["default", "junit"],
    setupFiles: ["@testing-library/jest-dom"],
    teardownTimeout: 10000,
    testTimeout: 30000,
    watch: false,
  },
};

export const config = mergeConfig(baseConfig, {
  plugins: [
    dts({
      outDir: "../../dist/libs/utils",
      tsconfigPath: join(__dirname, "tsconfig.lib.json"),
    }),
  ],
});

export default defineConfig(config);
