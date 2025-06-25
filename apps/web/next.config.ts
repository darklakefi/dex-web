import { withNx } from "@nx/next";
import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig = {
  distDir: "../../dist/apps/web",
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
  serverExternalPackages: ["pg"],
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

  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        dns: false,
        fs: false,
        http: false,
        https: false,
        net: false,
        os: false,
        pg: false,
        "pg-native": false,
        tls: false,
      };
    }
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
} satisfies NextConfig;

export default withNx(nextConfig);
