import { resolve } from "node:path";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const baseConfig = {
    cacheDir: "../../node_modules/.vite/libs/orpc",
    plugins: [nxViteTsPaths()],
    root: __dirname,
    test: {
      alias: {
        "../../getHelius": resolve(__dirname, "src/mocks/helius.mock.ts"),
      },
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/orpc",
      },
      environment: "happy-dom",
      globals: true,
      hookTimeout: 30000,
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      name: "orpc",
      outputFile: "./test-results/test-output.json",
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
