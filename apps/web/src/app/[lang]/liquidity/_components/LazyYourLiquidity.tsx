"use client";

import dynamic from "next/dynamic";
import { Box } from "@dex-web/ui";
import { SkeletonLoader } from "../../../_components/SkeletonLoader";

const YourLiquidity = dynamic(
  () =>
    import("./YourLiquidity").then((mod) => ({
      default: mod.YourLiquidity,
    })),
  {
    loading: () => (
      <Box className="mt-4 w-full max-w-md animate-pulse">
        <SkeletonLoader className="mb-3 h-6 w-32" variant="text" />
        <div className="space-y-3">
          <SkeletonLoader className="h-4 w-40" variant="balance" />
          <SkeletonLoader className="h-4 w-36" variant="balance" />
          <SkeletonLoader className="h-10 w-full" variant="button" />
        </div>
      </Box>
    ),
    ssr: false,
  },
);

export { YourLiquidity as LazyYourLiquidity };
