import { join } from "node:path";
/// <reference types="vitest" />
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";
import { getViteProjectConfig } from "../../vite.config.base";

export default defineConfig(() => {
  const baseConfig = getViteProjectConfig({
    rootDir: __dirname,
    projectName: "core",
    buildType: "lib",
  });

  return mergeConfig(baseConfig, {
    plugins: [
      nxViteTsPaths(),
      dts({
        root: "../../",
        entryRoot: "src",
        tsconfigPath: join(__dirname, "tsconfig.lib.json"),
        include: ["src/**/*.ts"],
        outDir: "dist/libs/core",
      }),
    ],
  });
});
