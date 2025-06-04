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

  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test: { test: (arg0: string) => boolean } }) =>
        rule.test?.test?.(".svg"),
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      },
    );

    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
} satisfies NextConfig;

export default withNx(nextConfig);
