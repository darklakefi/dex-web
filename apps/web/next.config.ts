/** @type {import('next').NextConfig} */
import { withNx } from "@nx/next";
import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  turbopack: {
    rules: {
      "*.svg": {
        as: "*.js",
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              typescript: true,
              icon: true,
            },
          },
        ],
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    unoptimized: false,
  },
  nx: {
    svgr: false,
  },
  typescript: {
    tsconfigPath: "./tsconfig.lib.json",
  },
} satisfies NextConfig;

export default withNx(nextConfig);
