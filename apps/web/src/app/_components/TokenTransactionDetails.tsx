"use client";

import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import { Box, Icon, Text, Tooltip } from "@dex-web/ui";
import BigNumber from "bignumber.js";
import { cva, type VariantProps } from "class-variance-authority";
import { SwapRate } from "../[lang]/(swap)/_components/SwapRate";

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

function getImpact(priceImpactPercentage: number): "LOW" | "MEDIUM" | "HIGH" {
  if (priceImpactPercentage < 2) return "LOW";
  if (priceImpactPercentage < 5) return "MEDIUM";
  return "HIGH";
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
        MEDIUM: "**:text-yellow-500",
      },
    },
  },
);

interface SwapDetailsItemProps
  extends VariantProps<typeof swapDetailsItemVariants> {
  label: string;
  value: string | React.ReactNode;
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

export interface TokenTransactionDetailsProps {
  quote: GetQuoteOutput;
  tokenSellMint: string;
  tokenBuyMint: string;
  slippage: string;
}

export function TokenTransactionDetails({
  quote,
  tokenSellMint,
  tokenBuyMint,
  slippage,
}: TokenTransactionDetailsProps) {
  const tokenSell =
    quote.tokenX.address === tokenSellMint ? quote.tokenX : quote.tokenY;
  const tokenBuy =
    quote.tokenX.address === tokenBuyMint ? quote.tokenX : quote.tokenY;

  const minOutputValue = BigNumber(quote.amountOutRaw)
    .times(1 - quote.slippage / 100)
    .div(10 ** Number(tokenBuy.decimals))
    .toFixed(Number(tokenBuy.decimals));

  const estimatedFeesValue = `${BigNumber(quote.estimatedFee)
    .div(10 ** Number(tokenSell.decimals))
    .toString()} ${tokenSell.symbol}`;
  const impact = getImpact(quote.priceImpactPercentage);

  return (
    <Box background="highlight">
      <dl className="flex flex-col gap-2">
        <SwapDetailsItem label="Price" value={<SwapRate quote={quote} />} />
        <SwapDetailsItem
          impact={impact}
          label="Price Impact"
          value={`${quote.priceImpactPercentage}%`}
        />
        <SwapDetailsItem label="Max Slippage" value={`${slippage}%`} />
        <SwapDetailsItem label="Min. Output" value={minOutputValue} />
        <SwapDetailsItem
          label="MEV Protection"
          tooltip={
            <Text.Body2 className="max-w-xs text-green-300">
              Your trade details are cryptographically hidden from MEV bots,
              preventing sandwich attacks and ensuring you get the price you
              expect.
            </Text.Body2>
          }
          tooltipId="mev-protection-tooltip"
          value="Active"
        />
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
