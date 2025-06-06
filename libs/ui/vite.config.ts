/// <reference types='vitest' />
import { join } from "node:path";

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import { getViteProjectConfig } from "../../vite.config.base";
const baseConfig = getViteProjectConfig({
  rootDir: __dirname,
  projectName: "ui",
  buildType: "lib",
  browserSettings: {
    enabled: true,
  },
});

export const config = mergeConfig(baseConfig, {
  assetsInclude: ["**/*.svg"],
  plugins: [
    react(),
    tailwindcss(),
    svgr({ include: "**/*.svg" }),
    nxCopyAssetsPlugin(["*.md"]),
    nxViteTsPaths(),
    dts({
      root: "../../",
      entryRoot: "src",
      tsconfigPath: join(__dirname, "tsconfig.lib.json"),
      include: ["src/**/*.{ts,tsx}"],
      outDir: "dist/libs/ui",
    }),
  ],
});

export default defineConfig(config);
