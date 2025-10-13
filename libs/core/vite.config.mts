/// <reference types="vitest" />
import { resolve } from "node:path";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const baseConfig = {
    cacheDir: "../../node_modules/.vite/libs/core",
    plugins: [nxViteTsPaths()],
    root: __dirname,
    test: {
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/core",
      },
      deps: {
        inline: ["react", "react-dom"],
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
      setupFiles: [resolve(__dirname, "vitest.setup.ts")],
      teardownTimeout: 10000,
      testTimeout: 30000,
      transformMode: {
        web: ["**/*.{js,ts,jsx,tsx}"],
      },
      watch: false,
    },
  };

  if (mode === "test") {
    return {
      ...baseConfig,
      plugins: [react(), nxViteTsPaths()],
    };
  }

  return baseConfig;
});
