/// <reference types='vitest' />
import { join, resolve } from "node:path";

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import reactSwc from "@vitejs/plugin-react-swc";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";

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
      name: "@dex-web/ui",
    },
    outDir: "./dist",
    reportCompressedSize: true,
    rollupOptions: {
      external: (id: string) =>
        id.includes("../../node_modules") || id.startsWith("@dex-web/"),
    },
  },
  cacheDir: "../../node_modules/.vite/libs/ui",
  resolve: {
    conditions: ["browser", "module", "import", "default"],
  },
  root: __dirname,

  test: {
    coverage: {
      provider: "v8" as const,
      reportsDirectory: "../../coverage/libs/ui",
    },
    deps: {
      inline: ["react", "react-dom"],
      web: {
        transformAssets: true,
      },
    },
    env: {
      NODE_ENV: "test",
    },
    environment: "happy-dom",
    globals: true,
    hookTimeout: 30000,
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    name: "ui",
    outputFile: {
      json: "./test-results/test-output.json",
      junit: "../../test-results/libs-ui/junit.xml",
    },
    pool: "forks" as const,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    reporters: ["default", "junit"],
    setupFiles: [
      "@testing-library/jest-dom",
      resolve(__dirname, "vitest.setup.ts"),
    ],
    teardownTimeout: 10000,
    testTimeout: 30000,
    transformMode: {
      web: ["**/*.{js,ts,jsx,tsx}", "**/*.svg"],
    },
    watch: false,
  },
};

export const config = mergeConfig(baseConfig, {
  plugins: [
    reactSwc(),
    tailwindcss(),
    svgr({
      include: "src/**/*.svg",
      svgrOptions: {
        exportType: "default",
        svgo: false,
      },
    }),
    nxCopyAssetsPlugin(["*.md", "package.json"]),
    dts({
      entryRoot: "src",
      tsconfigPath: join(__dirname, "tsconfig.lib.json"),
    }),
  ],
  resolve: {},
});

export default defineConfig(({ mode }) => {
  if (mode === "typecheck") {
    return {
      ...config,
      build: {
        ...config.build,
        rollupOptions: {
          ...config.build?.rollupOptions,
          output: {
            format: "es",
          },
        },
        write: false,
      },
    };
  }

  if (mode === "test") {
    return {
      ...config,
      plugins: [
        react(),
        tailwindcss(),
        svgr({
          include: "src/**/*.svg",
          svgrOptions: {
            exportType: "default",
            svgo: false,
          },
        }),
        nxCopyAssetsPlugin(["*.md", "package.json"]),
      ],
    };
  }

  return config;
});
