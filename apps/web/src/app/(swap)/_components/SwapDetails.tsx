"use client";

import { tanstackClient } from "@dex-web/orpc";
import { Box, Icon } from "@dex-web/ui";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cva, type VariantProps } from "class-variance-authority";

function getImpact(priceImpactPercentage: number) {
  switch (true) {
    case priceImpactPercentage <= 0.5:
      return "LOW";
    case priceImpactPercentage <= 2:
      return "MEDIUM";
    default:
      return "HIGH";
  }
}

function getSwapDetailsIcon(impact: "LOW" | "MEDIUM" | "HIGH") {
  switch (impact) {
    case "LOW":
      return null;
    case "MEDIUM":
      return <Icon className="size-4" name="exclamation" />;
    case "HIGH":
      return <Icon className="size-4" name="exclamation" />;
  }
}

const swapDetailsItemVariants = cva(
  "flex justify-between text-lg uppercase leading-6 tracking-wider",
  {
    defaultVariants: {
      impact: "LOW",
    },
    variants: {
      impact: {
        HIGH: "**:text-red-300",
        LOW: "**:text-green-300",
        MEDIUM: "**:text-yellow-300",
      },
    },
  },
);

interface SwapDetailsItemProps
  extends VariantProps<typeof swapDetailsItemVariants> {
  label: string;
  value: string;
}

function SwapDetailsItem({ impact, label, value }: SwapDetailsItemProps) {
  return (
    <div className={swapDetailsItemVariants({ impact })}>
      <dd className="inline-flex items-center gap-2">
        {getSwapDetailsIcon(impact ?? "LOW")}
        {label}
      </dd>
      <dt className="text-green-200">{value}</dt>
    </div>
  );
}
export function SwapDetails() {
  const { data: swapDetails } = useSuspenseQuery(
    tanstackClient.getSwapDetails.queryOptions({ input: { swapId: "1" } }),
  );

  const priceValue = `1 ${swapDetails.buyToken.symbol} ≈ ${swapDetails.exchangeRate} ${swapDetails.sellToken.symbol}`;
  const priceImpactValue = `${swapDetails.priceImpactPercentage}%`;
  const maxSlippageValue = `${swapDetails.slippageTolerancePercentage}%`;
  const mevProtectionValue = swapDetails.mevProtectionEnabled
    ? "Active"
    : "Inactive";
  const estimatedFeesValue = `$${swapDetails.estimatedFeesUsd}`;
  const impact = getImpact(swapDetails.priceImpactPercentage);

  return (
    <Box background="highlight" className="flex flex-col gap-2">
      <SwapDetailsItem label="Price" value={priceValue} />
      <SwapDetailsItem
        impact={impact}
        label="Price Impact"
        value={priceImpactValue}
      />
      <SwapDetailsItem label="Max Slippage" value={maxSlippageValue} />
      <SwapDetailsItem label="MEV Protection" value={mevProtectionValue} />
      <SwapDetailsItem label="Est. Fees" value={estimatedFeesValue} />
    </Box>
  );
}
