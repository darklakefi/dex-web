import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

const baseConfig = {
  cacheDir: "../../node_modules/.vite/libs/utils",
  plugins: [nxViteTsPaths()],
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
    outputFile: {
      json: "./test-results/test-output.json",
      junit: "../../test-results/libs-utils/junit.xml",
    },
    // Use threads pool with a single worker to play nicely with sandboxed CI
    pool: "threads" as const,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    reporters: ["default", "junit"],
    setupFiles: ["@testing-library/jest-dom"],
    teardownTimeout: 10000,
    testTimeout: 30000,
    watch: false,
  },
};

export const config = baseConfig;

export default defineConfig(config);
