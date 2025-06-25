import { join, resolve } from "node:path";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  const baseConfig = {
    cacheDir: "../../node_modules/.vite/libs/orpc",
    root: __dirname,
    test: {
      alias: {
        "../../helius": resolve(__dirname, "src/mocks/helius.mock.ts"),
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

  return mergeConfig(baseConfig, {
    plugins: [
      dts({
        copyDtsFiles: true,
        outDir: "./out-tsc/lib",
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
