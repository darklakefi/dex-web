import { join } from "node:path";
/// <reference types='vitest' />
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import { defineConfig, mergeConfig } from "vitest/config";
import { getViteProjectConfig } from "../../vite.config.base";

export default defineConfig(() => {
  const baseConfig = getViteProjectConfig({
    rootDir: __dirname,
    projectName: "web",
    buildType: "app",
  });

  return mergeConfig(baseConfig, {
    plugins: [
      svgr({ include: "**/*.svg" }),
      react(),
      nxCopyAssetsPlugin(["*.md"]),
      dts({
        entryRoot: "src",
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      }),
    ],
  });
});
