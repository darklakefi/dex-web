/// <reference types='vitest' />
import { join, resolve } from "node:path";

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";

const baseConfig = {
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/ui",
  test: {
    name: "ui",
    environment: "happy-dom",
    setupFiles: ["@testing-library/jest-dom"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    coverage: {
      provider: "v8" as const,
      reportsDirectory: "../../coverage/libs/ui",
    },
    deps: {
      web: {
        transformAssets: true,
      },
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
      name: "@dex-web/ui",
      fileName: "index",
      formats: ["es" as const],
    },
  },
};

export const config = mergeConfig(baseConfig, {
  assetsInclude: ["**/*.svg"],
  plugins: [
    react(),
    tailwindcss(),
    svgr({ include: "**/*.svg" }),
    nxCopyAssetsPlugin(["*.md"]),
    dts({
      entryRoot: "src",
      tsconfigPath: join(__dirname, "tsconfig.lib.json"),
    }),
  ],
});

export default defineConfig(config);
