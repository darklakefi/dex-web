import { join } from "node:path";
/// <reference types='vitest' />
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig(() => {
  const baseConfig = {
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      outDir: "./dist",
      reportCompressedSize: true,
      rollupOptions: {
        external: (id: string) =>
          id.includes("node_modules") || id.startsWith("@dex-web/"),
      },
    },
    cacheDir: "../../node_modules/.vite/apps/web",
    root: __dirname,
    test: {
      coverage: {
        provider: "v8" as const,
        reportsDirectory: "../../coverage/apps/web",
      },
      environment: "happy-dom",
      globals: true,
      hookTimeout: 30000,
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      name: "web",
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
      svgr({ include: "**/*.svg" }),
      react(),
      nxCopyAssetsPlugin(["*.md"]),
      dts({
        copyDtsFiles: true,
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
