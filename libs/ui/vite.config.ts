/// <reference types='vitest' />
import { resolve } from "node:path";

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import {
  createLibraryBuildConfig,
  createViteBaseConfig,
} from "../../vite.config.base";

export default defineConfig(() => {
  const baseConfig = createViteBaseConfig({
    projectName: "ui",
    cacheDir: "../../node_modules/.vite/libs/ui",
    coverageDir: "../../coverage/libs/ui",
    testEnvironment: "browser",
    browserConfig: {
      enabled: true,
      provider: "playwright",
      headless: true,
      name: "chromium",
    },
  });

  return mergeConfig(baseConfig, {
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
    build: createLibraryBuildConfig({
      entryPath: resolve(__dirname, "src/index.ts"),
      outputPath: "../../dist/libs/ui",
      name: "ui",
      formats: ["es"],
      external: ["react", "react-dom", "react/jsx-runtime"],
    }),
  });
});
