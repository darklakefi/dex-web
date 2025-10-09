"use client";

import dynamic from "next/dynamic";

export const SwapTransactionHistoryWrapper = dynamic(
  () =>
    import("./SwapTransactionHistory").then((mod) => ({
      default: mod.SwapTransactionHistory,
    })),
  { ssr: false },
);
