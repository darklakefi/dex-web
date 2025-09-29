"use client";

import dynamic from "next/dynamic";
import { SkeletonLoader } from "./SkeletonLoader";

const LiquidityForm = dynamic(
  () => import("../[lang]/liquidity/_components/LiquidityForm").then(mod => ({ default: mod.LiquidityForm })),
  {
    loading: () => <SkeletonLoader />,
    ssr: false,
  }
);

export { LiquidityForm as LazyLiquidityForm };