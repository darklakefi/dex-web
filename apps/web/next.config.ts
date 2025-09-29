import { join } from "node:path";
import { withNx } from "@nx/next";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  experimental: {
    reactCompiler: true,
    typedRoutes: true,
    webpackBuildWorker: true,
  },
  images: {
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    dangerouslyAllowSVG: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ["image/webp", "image/avif"],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    unoptimized: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  nx: {
    svgr: false,
  },
  outputFileTracingRoot: join(__dirname, "../../"),
  serverExternalPackages: [
    "pg",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "@connectrpc/connect-node",
  ],
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
    tsconfigPath: "./tsconfig.json",
  },

  webpack(config, { isServer }) {
    config.cache = {
      type: "memory",
      maxGenerations: 1,
    };

    config.infrastructureLogging = {
      debug: false,
      level: "warn",
      stream: process.stderr,
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (
        args[0]?.includes?.("PackFileCacheStrategy") &&
        args[0]?.includes?.("Serializing big strings")
      ) {
        return;
      }
      originalWarn(...args);
    };

    if (!isServer) {
      const webpack = require("webpack");

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /client-server$/,
          "./client-server.browser.ts",
        ),
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        dns: false,
        fs: false,
        http: false,
        http2: false,
        https: false,
        net: false,
        os: false,
        pg: false,
        "pg-native": false,
        tls: false,
        util: false,
        zlib: false,
      };
    }

    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    return config;
  },
} satisfies NextConfig;

const nxConfig = withNx(withNextIntl(nextConfig));

export default withSentryConfig(nxConfig, {
  automaticVercelMonitors: true,
  disableLogger: true,
  org: "darklake",
  project: "darklake",
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
});
