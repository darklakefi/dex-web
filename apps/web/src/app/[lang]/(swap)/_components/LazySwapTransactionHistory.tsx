"use client";

import dynamic from "next/dynamic";
import { Box } from "@dex-web/ui";
import { SkeletonLoader } from "../../../_components/SkeletonLoader";

const SwapTransactionHistory = dynamic(
  () =>
    import("./SwapTransactionHistory").then((mod) => ({
      default: mod.SwapTransactionHistory,
    })),
  {
    loading: () => (
      <Box className="mt-6 w-full max-w-md animate-pulse">
        <SkeletonLoader className="mb-3 h-6 w-40" variant="text" />
        <div className="space-y-2">
          <SkeletonLoader className="h-4 w-full" variant="text" />
          <SkeletonLoader className="h-4 w-3/4" variant="text" />
          <SkeletonLoader className="h-4 w-5/6" variant="text" />
        </div>
      </Box>
    ),
    ssr: false,
  },
);

export { SwapTransactionHistory as LazySwapTransactionHistory };