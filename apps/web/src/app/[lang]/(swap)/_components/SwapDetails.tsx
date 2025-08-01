"use client";

import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import { Box, Icon } from "@dex-web/ui";
import BigNumber from "bignumber.js";
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

  const priceValue = `1 ${quote.tokenX.symbol} ≈ ${quote.isXtoY ? quote.rateXtoY : 1 / quote.rateXtoY} ${quote.tokenY.symbol}`;
  // const priceImpactValue = `${quote.priceImpactPercentage}%`;
  const minOutputValue = BigNumber(quote.amountOutRaw)
    .times(1 - quote.slippage / 100)
    .div(10 ** Number(tokenBuy.decimals))
    .toFixed(Number(tokenBuy.decimals));

  // const maxSlippageValue = `${quote.slippage}%`;
  // const mevProtectionValue = true ? "Active" : "Inactive";
  const estimatedFeesValue = `${BigNumber(quote.estimatedFee)
    .div(10 ** Number(tokenSell.decimals))
    .toString()} ${tokenSell.symbol}`;
  // const impact = getImpact(quote.priceImpactPercentage);

  return (
    <Box background="highlight">
      <dl className="flex flex-col gap-2">
        <SwapDetailsItem label="Price" value={priceValue} />
        {/* <SwapDetailsItem
          impact={impact}
          label="Price Impact"
          value={priceImpactValue}
        /> */}
        <SwapDetailsItem label="Min. Output" value={minOutputValue} />
        <SwapDetailsItem label="MEV Protection" value="Active" />
        <SwapDetailsItem label="Est. Fees" value={estimatedFeesValue} />
      </dl>
    </Box>
  );
}
