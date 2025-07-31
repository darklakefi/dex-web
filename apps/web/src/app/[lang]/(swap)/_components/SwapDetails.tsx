"use client";

import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import { Box, Icon } from "@dex-web/ui";
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

export interface SwapDetailsProps {
  quote: GetQuoteOutput;
  tokenSellMint: string;
  tokenBuyMint: string;
}

export function SwapDetails({
  quote,
  tokenSellMint,
  tokenBuyMint,
}: SwapDetailsProps) {
  const tokenSell =
    quote.tokenX.address === tokenSellMint ? quote.tokenX : quote.tokenY;
  const tokenBuy =
    quote.tokenX.address === tokenBuyMint ? quote.tokenX : quote.tokenY;
  const rate =
    quote.tokenX.address === tokenSellMint
      ? quote.rateXtoY
      : 1 / quote.rateXtoY;

  const priceValue = `1 ${tokenBuy.symbol} ≈ ${rate} ${tokenSell.symbol}`;
  const priceImpactValue = `${quote.priceImpactPercentage}%`;
  // const maxSlippageValue = `${quote.slippage}%`;
  // const mevProtectionValue = true ? "Active" : "Inactive";
  const estimatedFeesValue = `$${quote.estimatedFeesUsd}`;
  const impact = getImpact(quote.priceImpactPercentage);

  return (
    <Box background="highlight">
      <dl className="flex flex-col gap-2">
        <SwapDetailsItem label="Price" value={priceValue} />
        <SwapDetailsItem
          impact={impact}
          label="Price Impact"
          value={priceImpactValue}
        />
        {/* <SwapDetailsItem label="Max Slippage" value={maxSlippageValue} /> */}
        <SwapDetailsItem label="MEV Protection" value="Active" />
        <SwapDetailsItem label="Est. Fees" value={estimatedFeesValue} />
      </dl>
    </Box>
  );
}
