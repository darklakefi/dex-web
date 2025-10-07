/// <reference types='vitest' />
import { defineConfig } from "vite";

export default defineConfig(() => ({
  cacheDir: "../../node_modules/.vite/libs/liquidity-calculations",
  root: __dirname,
  test: {
    coverage: {
      provider: "v8" as const,
      reportsDirectory: "./test-output/vitest/coverage",
    },
    environment: "node",
    globals: true,
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    name: "liquidity-calculations",
    reporters: ["default"],
    watch: false,
  },
}));
