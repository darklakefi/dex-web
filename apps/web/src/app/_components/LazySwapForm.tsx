"use client";

import dynamic from "next/dynamic";
import { SkeletonLoader } from "./SkeletonLoader";

const SwapForm = dynamic(
  () => import("../[lang]/(swap)/_components/SwapForm").then(mod => ({ default: mod.SwapForm })),
  {
    loading: () => <SkeletonLoader />,
    ssr: false,
  }
);

export { SwapForm as LazySwapForm };