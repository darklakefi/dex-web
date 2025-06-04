import { resolve } from "node:path";
/// <reference types='vitest' />
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/ui",
  assetsInclude: ["**/*.svg"],

  plugins: [
    react(),
    tailwindcss(),
    svgr({ include: "**/*.svg" }),
    nxCopyAssetsPlugin(["*.md"]),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
      entryRoot: resolve(__dirname, "src"),
    }),
  ],
  test: {
    watch: false,

    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/libs/ui",
      provider: "v8",
    },
    deps: {
      web: {
        transformAssets: true,
      },
    },

    name: "ui",
    globals: true,
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      name: "chromium",
    },
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: "../../dist/libs/ui",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: resolve(__dirname, "src/index.ts"),
      name: "ui",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es" as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
