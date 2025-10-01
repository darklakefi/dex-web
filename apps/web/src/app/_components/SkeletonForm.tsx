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
  testId: _testId = "skeleton-form",
  "aria-label": _ariaLabel = "Loading form",
  type = "liquidity",
}: SkeletonFormProps = {}) {
  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <div className="flex flex-col gap-4">
          {}
          <SkeletonTokenInput
            label={type === "liquidity" ? "SELL AMOUNT" : "SELLING"}
          />

          {}
          <div className="flex items-center justify-center">
            <div
              aria-label={`${type === "liquidity" ? "Plus" : "Swap"} - ${type === "liquidity" ? "Adding liquidity to pool" : "Swapping tokens"}`}
              className="inline-flex size-8 items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300"
              role="img"
            >
              <Icon
                className="size-5"
                name={type === "liquidity" ? "plus" : "swap"}
              />
            </div>
          </div>

          <SkeletonTokenInput
            label={type === "liquidity" ? "BUY AMOUNT" : "BUYING"}
          />

          {}
          <SkeletonLoader className="h-12 w-full" variant="button" />

          {}
          <SkeletonLoader className="h-4 w-40" variant="text" />
        </div>

        {}
        {type === "liquidity" && (
          <div className="mt-4 space-y-2">
            <SkeletonLoader className="h-4 w-32" variant="text" />
            <SkeletonLoader className="h-4 w-24" variant="text" />
            <SkeletonLoader className="h-4 w-28" variant="text" />
          </div>
        )}
      </Box>

      <div className="flex flex-col gap-1">
        {}
        <SkeletonLoader className="h-10 w-10" variant="button" />

        {}
        <SkeletonLoader className="h-10 w-10" variant="button" />
      </div>
    </section>
  );
}
