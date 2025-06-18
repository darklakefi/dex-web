import { join, resolve } from "node:path";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  const baseConfig = {
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        fileName: "index",
        formats: ["es" as const],
        name: "@dex-web/utils",
      },
      outDir: "./dist",
      reportCompressedSize: true,
      rollupOptions: {
        external: (id: string) =>
          id.includes("node_modules") || id.startsWith("@dex-web/"),
      },
    },
    cacheDir: "../../node_modules/.vite/libs/utils",
    root: __dirname,
    test: {
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/utils",
      },
      environment: "happy-dom",
      globals: true,
      hookTimeout: 30000,
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      name: "utils",
      pool: "forks" as const,
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      reporters: ["default"],
      teardownTimeout: 10000,
      testTimeout: 30000,
      watch: false,
    },
  };

  return mergeConfig(baseConfig, {
    plugins: [
      nxCopyAssetsPlugin(["*.md", "package.json"]),
      dts({
        copyDtsFiles: true,
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
