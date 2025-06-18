import { join, resolve } from "node:path";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
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
        name: "@dex-web/orpc",
      },
      outDir: "./dist",
      reportCompressedSize: true,
      rollupOptions: {
        external: (id: string) =>
          id.includes("node_modules") || id.startsWith("@dex-web/"),
      },
    },
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
