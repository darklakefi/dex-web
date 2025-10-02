"use client";

import { Box, Text } from "@dex-web/ui";
import { SkeletonLoader } from "../../../_components/SkeletonLoader";

interface LiquidityFormSkeletonProps {
  testId?: string;
  "aria-label"?: string;
}

function TokenInputSkeletonBox() {
  return (
    <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3">
      <div>
        <Text.Body2 as="label" className="mb-3 block text-green-300 uppercase">
          TOKEN
        </Text.Body2>
        <SkeletonLoader className="h-10 w-32" variant="button" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-end gap-3">
        <div className="mb-3 flex gap-3">
          <SkeletonLoader className="h-4 w-28" variant="balance" />
          <SkeletonLoader className="h-4 w-12" variant="text" />
          <SkeletonLoader className="h-4 w-12" variant="text" />
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <SkeletonLoader className="h-10 w-32" variant="input" />
          </div>
          <SkeletonLoader className="mt-1 h-4 w-20" variant="text" />
        </div>
      </div>
    </Box>
  );
}

export function LiquidityFormSkeleton({
  testId = "liquidity-form-skeleton",
  "aria-label": ariaLabel = "Loading liquidity form",
}: LiquidityFormSkeletonProps = {}) {
  // Suppress unused parameter warnings for accessibility props
  void testId;
  void ariaLabel;
  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-4">
            <TokenInputSkeletonBox />

            <div className="flex items-center justify-center">
              <div className="inline-flex size-8 items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300">
                <SkeletonLoader className="size-5" variant="circle" />
              </div>
            </div>

            <TokenInputSkeletonBox />
          </fieldset>

          <SkeletonLoader className="h-12 w-full" variant="button" />
        </div>
      </Box>

      <div className="flex flex-col gap-1">
        <SkeletonLoader className="h-10 w-10" variant="button" />
        <SkeletonLoader className="h-10 w-10" variant="button" />
      </div>
    </section>
  );
}

export function PoolDetailsSkeleton() {
  return (
    <Box className="gap-1 bg-green-600 py-3">
      <div className="flex items-center justify-between border-green-500 border-b pb-4">
        <Text.Body2 className="text-green-300">Total Deposit</Text.Body2>
        <div className="text-right">
          <SkeletonLoader className="h-4 w-20" variant="text" />
          <SkeletonLoader className="mt-1 h-4 w-16" variant="text" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pt-4">
          <Text.Body2 className="text-green-300">Pool Price</Text.Body2>
          <div className="flex items-center gap-1">
            <SkeletonLoader className="h-4 w-24" variant="text" />
            <SkeletonLoader className="size-6" variant="circle" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Text.Body2 className="text-green-300">Slippage Tolerance</Text.Body2>
          <SkeletonLoader className="h-4 w-8" variant="text" />
        </div>
      </div>
    </Box>
  );
}
