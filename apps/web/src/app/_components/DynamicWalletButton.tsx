"use client";

import dynamic from "next/dynamic";
import { SkeletonWalletButton } from "./SkeletonWalletButton";

const WalletButton = dynamic(
  () => import("./WalletButton").then((mod) => ({ default: mod.WalletButton })),
  {
    loading: () => <SkeletonWalletButton className="h-10 w-32" />,
    ssr: false,
  },
);

export { WalletButton as DynamicWalletButton };
