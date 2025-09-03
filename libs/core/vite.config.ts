/// <reference types="vitest" />
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const baseConfig = {
    cacheDir: "../../node_modules/.vite/libs/core",
    plugins: [nxViteTsPaths()],
    root: __dirname,
    test: {
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/core",
      },
      environment: "happy-dom",
      globals: true,
      hookTimeout: 30000,
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      name: "core",
      outputFile: {
        json: "./test-results/test-output.json",
        junit: "../../test-results/libs-core/junit.xml",
      },
      pool: "forks" as const,
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      reporters: ["default", "junit"],
      teardownTimeout: 10000,
      testTimeout: 30000,
      watch: false,
    },
  };

  return baseConfig;
});
