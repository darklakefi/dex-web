"use client";

import dynamic from "next/dynamic";
import { SkeletonForm } from "./SkeletonForm";

const SwapForm = dynamic(
  () => import("../[lang]/(swap)/_components/SwapForm").then(mod => ({ default: mod.SwapForm })),
  {
    loading: () => <SkeletonForm type="swap" />,
    ssr: false,
  }
);

export { SwapForm as LazySwapForm };