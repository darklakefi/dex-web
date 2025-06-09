/// <reference types="vitest" />
import { builtinModules } from "node:module";
import { join, resolve } from "node:path";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  const baseConfig = {
    root: __dirname,
    cacheDir: "../../node_modules/.vite/libs/db",
    test: {
      name: "db",
      environment: "happy-dom",
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/db",
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
        name: "@dex-web/db",
        fileName: "index",
        formats: ["es" as const],
      },
      rollupOptions: {
        external: [
          ...builtinModules,
          "pg",
          "pg-cloudflare",
          "cloudflare:sockets",
        ],
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
