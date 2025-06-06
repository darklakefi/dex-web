import { join } from "node:path";
/// <reference types='vitest' />
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig(() => {
  const baseConfig = {
    root: __dirname,
    cacheDir: "../../node_modules/.vite/apps/web",
    test: {
      name: "web",
      environment: "happy-dom",
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/apps/web",
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
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };

  return mergeConfig(baseConfig, {
    plugins: [
      svgr({ include: "**/*.svg" }),
      react(),
      nxCopyAssetsPlugin(["*.md"]),
      dts({
        entryRoot: "src",
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
