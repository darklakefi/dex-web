/** @type {import('next').NextConfig} */
import { withNx } from "@nx/next";
import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    unoptimized: false,
  },
  nx: {
    svgr: false,
  },
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
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
} satisfies NextConfig;

export default withNx(nextConfig);
