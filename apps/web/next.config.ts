import { join } from "node:path";
import { withNx } from "@nx/next";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@dex-web/ui",
      "@dex-web/core",
      "@solana/wallet-adapter-react",
      "@solana/web3.js",
      "@tanstack/react-query",
      "bignumber.js",
      "date-fns",
    ],
    reactCompiler: true,
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

    remotePatterns: [
      {
        hostname: "raw.githubusercontent.com",
        protocol: "https",
      },
      {
        hostname: "*.arweave.net",
        protocol: "https",
      },
      {
        hostname: "arweave.net",
        protocol: "https",
      },
      {
        hostname: "*.ipfs.nftstorage.link",
        protocol: "https",
      },
      {
        hostname: "ipfs.io",
        protocol: "https",
      },
      {
        hostname: "shdw-drive.genesysgo.net",
        protocol: "https",
      },
      {
        hostname: "*.helius-rpc.com",
        protocol: "https",
      },
      {
        hostname: "cdn.helius-rpc.com",
        protocol: "https",
      },
      {
        hostname: "*.amazonaws.com",
        protocol: "https",
      },
      {
        hostname: "*.cloudfront.net",
        protocol: "https",
      },
    ],
    unoptimized: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  output: "standalone",
  outputFileTracingRoot: join(__dirname, "../../"),
  serverExternalPackages: [
    "pg",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "@connectrpc/connect-node",
  ],
  transpilePackages: ["@dex-web/ui", "@dex-web/core"],
  typedRoutes: true,
  typescript: {
    tsconfigPath: "./tsconfig.lib.json",
  },

  webpack(config, { isServer }) {
    config.infrastructureLogging = {
      debug: false,
      level: "warn",
      stream: process.stderr,
    };

    // Suppress bigint-buffer native bindings warning in browser
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /Failed to load bindings/,
        module: /node_modules\/bigint-buffer/,
      },
    ];

    config.module.rules.unshift({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            exportType: "default",
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
            titleProp: true,
          },
        },
      ],
    });

    config.module.rules = config.module.rules.map((rule, index) => {
      if (!rule || typeof rule !== "object") return rule;

      if (index === 0) return rule;

      if (rule.test instanceof RegExp && rule.test.test(".svg")) {
        return { ...rule, exclude: /\.svg$/ };
      }

      if (Array.isArray(rule.oneOf)) {
        return {
          ...rule,
          oneOf: rule.oneOf.map((oneOfRule) => {
            if (
              oneOfRule &&
              typeof oneOfRule === "object" &&
              oneOfRule.test instanceof RegExp &&
              oneOfRule.test.test(".svg")
            ) {
              return { ...oneOfRule, exclude: /\.svg$/ };
            }
            return oneOfRule;
          }),
        };
      }

      return rule;
    });

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

      // Suppress console warnings for known safe fallbacks in Solana packages
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /bigint-buffer$/,
          require.resolve("bigint-buffer"),
        ),
      );
    }

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
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    disable:
      process.env.NODE_ENV === "development" && process.env.CI === "true",
  },
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
});
