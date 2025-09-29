"use client";

import dynamic from "next/dynamic";
import { SkeletonLoader } from "./SkeletonLoader";

const WalletButton = dynamic(() => import("./WalletButton").then(mod => ({ default: mod.WalletButton })), {
  ssr: false,
  loading: () => <SkeletonLoader variant="wallet" className="h-10 w-32" />
});

export { WalletButton as DynamicWalletButton };