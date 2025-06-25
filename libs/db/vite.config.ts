import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { builtinModules } from "node:module";
import { join, resolve } from "node:path";
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
        name: "@dex-web/db",
      },
      outDir: "./dist",
      reportCompressedSize: true,
      rollupOptions: {
        external: [...builtinModules, "pg"],
      },
    },
    cacheDir: "../../node_modules/.vite/libs/db",
    root: __dirname,
    test: {
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/libs/db",
      },
      environment: "happy-dom",
      globals: true,
      hookTimeout: 30000,
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      name: "db",
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
      nxViteTsPaths(),
      nxCopyAssetsPlugin(["*.md", "package.json"]),
      dts({
        copyDtsFiles: true,
        outDir: "./out-tsc/lib",
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
