import { join } from "node:path";
import { withNx } from "@nx/next";
import type { NextConfig } from "next";

const nextConfig = {
  distDir: "dist",
  experimental: {
    reactCompiler: true,
    typedRoutes: true,
  },
  images: {
    unoptimized: false,
  },
  nx: {
    svgr: false,
  },
  outputFileTracingRoot: join(__dirname, "../../"),
  turbopack: {
    rules: {
      "*.svg": {
        as: "*.js",
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
              typescript: true,
            },
          },
        ],
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: "./tsconfig.lib.json",
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
} satisfies NextConfig;

export default withNx(nextConfig);
