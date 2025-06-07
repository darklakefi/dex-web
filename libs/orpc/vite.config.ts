/// <reference types="vitest" />
import { join, resolve } from "node:path";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  const baseConfig = {
    root: __dirname,
    cacheDir: "../../node_modules/.vite/libs/orpc",
    test: {
      name: "orpc",
      environment: "happy-dom",
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/orpc",
      },
      watch: false,
      reporters: ["default"],
      testTimeout: 30000,
      hookTimeout: 30000,
      teardownTimeout: 10000,
      pool: "forks" as const,
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      globals: true,
    },
    build: {
      outDir: "./dist",
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "@dex-web/orpc",
        fileName: "index",
        formats: ["es" as const],
      },
      rollupOptions: {
        external: [],
      },
    },
  };

  return mergeConfig(baseConfig, {
    plugins: [
      dts({
        entryRoot: "src",
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
