/// <reference types='vitest' />
import type { ViteUserConfig } from "vitest/config";

export const baseVitestConfig = {
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
  include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
};

export function createViteBaseConfig(options: {
  projectName: string;
  cacheDir: string;
  coverageDir: string;
  testEnvironment?: "happy-dom" | "jsdom" | "browser";
  browserConfig?: {
    enabled: boolean;
    provider: string;
    headless: boolean;
    name: string;
  };
}): ViteUserConfig {
  const testConfig: NonNullable<ViteUserConfig["test"]> = {
    ...baseVitestConfig,
    name: options.projectName,
    environment: options.testEnvironment || "happy-dom",
    coverage: {
      ...baseVitestConfig.coverage,
      reportsDirectory: options.coverageDir,
    },
  };

  if (options.browserConfig) {
    testConfig.browser = options.browserConfig;
    if (options.browserConfig.enabled) {
      testConfig.deps = {
        web: {
          transformAssets: true,
        },
      };
    }
  }

  return {
    root: process.cwd(),
    cacheDir: options.cacheDir,
    test: testConfig,
  };
}

export function createLibraryBuildConfig(options: {
  entryPath: string;
  outputPath: string;
  name: string;
  formats?: ("es" | "cjs")[];
  external?: string[];
}) {
  return {
    outDir: options.outputPath,
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: options.entryPath,
      name: options.name,
      fileName: "index",
      formats: options.formats || ["es" as const],
    },
    rollupOptions: {
      external: options.external || [],
    },
  };
}
