import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig, mergeConfig } from "vitest/config";
/// <reference types='vitest' />
import { createViteBaseConfig } from "../../vite.config.base";

export default defineConfig(() => {
  const baseConfig = createViteBaseConfig({
    projectName: "web",
    cacheDir: "../../node_modules/.vite/apps/web",
    coverageDir: "../../coverage/apps/web",
    testEnvironment: "happy-dom",
  });

  return mergeConfig(baseConfig, {
    plugins: [
      svgr({ include: "**/*.svg" }),
      react(),
      nxCopyAssetsPlugin(["*.md"]),
    ],
    test: {
      include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
  });
});
