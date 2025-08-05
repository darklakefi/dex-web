"use client";

import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import { Box, Icon, Text, Tooltip } from "@dex-web/ui";
import { numberFormatHelper } from "@dex-web/utils";
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
  tooltip?: React.ReactNode | string;
  tooltipId?: string;
}

function SwapDetailsItem({
  impact,
  label,
  value,
  tooltip,
  tooltipId,
}: SwapDetailsItemProps) {
  return (
    <div className={swapDetailsItemVariants({ impact })}>
      <dd className="inline-flex items-center gap-2">
        {getSwapDetailsIcon(impact ?? "LOW")}
        {label}
        {tooltipId && (
          <span className="cursor-pointer" data-tooltip-id={tooltipId}>
            [?]
          </span>
        )}
        {tooltip && tooltipId && <Tooltip id={tooltipId}>{tooltip}</Tooltip>}
      </dd>
      <dt className="text-green-200">{value}</dt>
    </div>
  );
}

export interface SwapDetailsProps {
  quote: GetQuoteOutput;
  tokenSellMint: string;
  tokenBuyMint: string;
  slippage: string;
}

export function SwapDetails({
  quote,
  tokenSellMint,
  tokenBuyMint,
  slippage,
}: SwapDetailsProps) {
  const tokenSell =
    quote.tokenX.address === tokenSellMint ? quote.tokenX : quote.tokenY;
  const tokenBuy =
    quote.tokenX.address === tokenBuyMint ? quote.tokenX : quote.tokenY;

  // const rateXtoY = quote.isXtoY ? quote.rate : BigNumber(1).div(quote.rate || 1).toString();
  // const rateYtoX = quote.isXtoY ? BigNumber(1).div(quote.rate || 1).toString() : quote.rate;

  const priceValue = `1 ${quote.isXtoY ? quote.tokenX.symbol : quote.tokenY.symbol} ≈ ${numberFormatHelper(
    {
      decimalScale: 5,
      thousandSeparator: true,
      trimTrailingZeros: true,
      value: quote.rate,
    },
  )} ${quote.isXtoY ? quote.tokenY.symbol : quote.tokenX.symbol}`;
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
        <SwapDetailsItem label="Max Slippage" value={`${slippage}%`} />
        <SwapDetailsItem label="Min. Output" value={minOutputValue} />
        <SwapDetailsItem label="MEV Protection" value="Active" />
        <SwapDetailsItem
          label="Est. Fees"
          tooltip={
            <div className="flex flex-col gap-4">
              <div className="flex gap-10">
                <Text.Body2 className="text-green-300">Protocol Fee</Text.Body2>
                <Text.Body2 className="text-green-200">
                  {estimatedFeesValue} (0.5%)
                </Text.Body2>
              </div>
            </div>
          }
          tooltipId="fee-tooltip"
          value={estimatedFeesValue}
        />
      </dl>
    </Box>
  );
}
