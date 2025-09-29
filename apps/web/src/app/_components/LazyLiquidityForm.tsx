"use client";

import dynamic from "next/dynamic";
import { SkeletonForm } from "./SkeletonForm";

const LiquidityForm = dynamic(
  () =>
    import("../[lang]/liquidity/_components/LiquidityForm").then((mod) => ({
      default: mod.LiquidityForm,
    })),
  {
    loading: () => <SkeletonForm type="liquidity" />,
    ssr: false,
  },
);

export { LiquidityForm as LazyLiquidityForm };
