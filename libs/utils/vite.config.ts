import { resolve } from "node:path";
/// <reference types="vitest" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/utils",

  plugins: [
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
      entryRoot: resolve(__dirname, "src"),
    }),
  ],

  // Configuration for building your library.
  build: {
    lib: {
      entry: "src/index.ts",
      name: "utils",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [],
    },
  },
  test: {
    name: "utils",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/libs/utils",
      provider: "v8",
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
