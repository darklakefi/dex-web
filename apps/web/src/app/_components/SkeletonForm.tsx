"use client";

import { Box, Icon } from "@dex-web/ui";
import { SkeletonLoader } from "./SkeletonLoader";
import { SkeletonTokenInput } from "./SkeletonTokenInput";

interface SkeletonFormProps {
  testId?: string;
  "aria-label"?: string;
  type?: "liquidity" | "swap";
}

export function SkeletonForm({
  testId = "skeleton-form",
  "aria-label": ariaLabel = "Loading form",
  type = "liquidity"
}: SkeletonFormProps = {}) {
  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <div className="flex flex-col gap-4">
          {/* Token Inputs */}
          <SkeletonTokenInput label={type === "liquidity" ? "SELL AMOUNT" : "SELLING"} />

          {/* Plus/Swap Icon Separator */}
          <div className="flex items-center justify-center">
            <div
              className="inline-flex size-8 items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300"
              role="img"
              aria-label={`${type === "liquidity" ? "Plus" : "Swap"} - ${type === "liquidity" ? "Adding liquidity to pool" : "Swapping tokens"}`}
            >
              <Icon className="size-5" name={type === "liquidity" ? "plus" : "swap"} />
            </div>
          </div>

          <SkeletonTokenInput label={type === "liquidity" ? "BUY AMOUNT" : "BUYING"} />
          
          {/* Action Button */}
          <SkeletonLoader variant="button" className="h-12 w-full" />
          
          {/* Transaction Status */}
          <SkeletonLoader variant="text" className="h-4 w-40" />
        </div>

        {/* Additional Details (for liquidity) */}
        {type === "liquidity" && (
          <div className="mt-4 space-y-2">
            <SkeletonLoader variant="text" className="h-4 w-32" />
            <SkeletonLoader variant="text" className="h-4 w-24" />
            <SkeletonLoader variant="text" className="h-4 w-28" />
          </div>
        )}
      </Box>

      <div className="flex flex-col gap-1">
        {/* Settings Button */}
        <SkeletonLoader variant="button" className="h-10 w-10" />
        
        {/* Plus/Create Pool Button */}
        <SkeletonLoader variant="button" className="h-10 w-10" />
      </div>
    </section>
  );
}