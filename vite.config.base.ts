/// <reference types='vitest' />
import { resolve } from "node:path";
import type { ViteUserConfig } from "vitest/config";

export const vitestBaseConfig = {
  watch: false,
  reporters: ["default"],
  coverage: {
    provider: "v8" as const,
  },
  testTimeout: 30000,
  hookTimeout: 30000,
  teardownTimeout: 10000,
  pool: "forks" as const,
  poolOptions: {
    forks: {
      singleFork: true,
    },
  },
  globals: true,
};

export function getViteProjectConfig(config: {
  rootDir: string;
  buildType: "app" | "lib";
  projectName: string;
  externals?: string[];
  browserSettings?: {
    enabled: boolean;
  };
}): ViteUserConfig {
  const cacheDir = `../../node_modules/.vite/${config.buildType === "app" ? "apps" : "libs"}/${config.projectName}`;
  const reportsDirectory = `../../coverage/${config.buildType === "app" ? "apps" : "libs"}/${config.projectName}`;
  const outputDirectory = `../../dist/${config.buildType === "app" ? "apps" : "libs"}/${config.projectName}`;
  const testConfig: NonNullable<ViteUserConfig["test"]> = {
    ...vitestBaseConfig,
    name: config.projectName,
    environment: "happy-dom",
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    coverage: {
      ...vitestBaseConfig.coverage,
      reportsDirectory: reportsDirectory,
    },
  };
  const buildConfig = {
    ...getViteBuildConfig({
      buildType: config.buildType,
      entryFile: resolve(config.rootDir, "src/index.ts"),
      outputDirectory: outputDirectory,
      libraryName: config.projectName,
      formats: ["es"],
      externals: config.externals,
    }),
  };

  if (config.browserSettings) {
    testConfig.browser = {
      enabled: config.browserSettings.enabled,
      provider: "playwright",
      headless: true,
      name: "chromium",
    };
    if (config.browserSettings.enabled) {
      testConfig.deps = {
        web: {
          transformAssets: true,
        },
      };
    }
  }

  return {
    root: config.rootDir,
    cacheDir: cacheDir,
    test: testConfig,
  };
}

function getViteBuildConfig(config: {
  entryFile: string;
  outputDirectory: string;
  buildType: "app" | "lib";
  libraryName: string;
  formats?: ("es" | "cjs")[];
  externals?: string[];
}) {
  if (config.buildType === "lib") {
    return {
      build: {
        outDir: config.outputDirectory,
        emptyOutDir: true,
        reportCompressedSize: true,
        commonjsOptions: {
          transformMixedEsModules: true,
        },
        lib: {
          entry: config.entryFile,
          name: config.libraryName,
          fileName: "index",
          formats: config.formats || ["es" as const],
        },
        rollupOptions: {
          external: config.externals || [],
        },
      },
    };
  }

  return {
    build: {
      outDir: config.outputDirectory,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
}
