import { join } from "node:path";
import { withNx } from "@nx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  experimental: {
    reactCompiler: false,
    typedRoutes: true,
  },
  images: {
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
  serverExternalPackages: ["pg", "@grpc/grpc-js", "@grpc/proto-loader"],
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
    // Use the main tsconfig for Next.js builds
    tsconfigPath: "./tsconfig.json",
  },

  webpack(config, { isServer }) {
    if (!isServer) {
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
      };
    }
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
} satisfies NextConfig;

export default withNx(withNextIntl(nextConfig));
