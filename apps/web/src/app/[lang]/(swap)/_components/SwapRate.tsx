"use client";

import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import { Icon } from "@dex-web/ui";
import { numberFormatHelper } from "@dex-web/utils";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";

export interface SwapRateProps {
  quote: GetQuoteOutput;
}

export function SwapRate({ quote }: SwapRateProps) {
  const [isXtoY, setIsXtoY] = useState(quote.isXtoY);

  useEffect(() => {
    setIsXtoY(quote.isXtoY);
  }, [quote.isXtoY]);
  const rateXtoY = quote.isXtoY
    ? quote.rate
    : BigNumber(1)
        .div(quote.rate || 1)
        .toString();
  const rateYtoX = quote.isXtoY
    ? BigNumber(1)
        .div(quote.rate || 1)
        .toString()
    : quote.rate;

  const priceXtoY = `1 ${quote.tokenX.symbol} ≈ ${numberFormatHelper({
    decimalScale: 5,
    thousandSeparator: true,
    trimTrailingZeros: true,
    value: rateXtoY,
  })} ${quote.tokenY.symbol}`;

  const priceYtoX = `1 ${quote.tokenY.symbol} ≈ ${numberFormatHelper({
    decimalScale: 5,
    thousandSeparator: true,
    trimTrailingZeros: true,
    value: rateYtoX,
  })} ${quote.tokenX.symbol}`;

  const handleClick = () => {
    setIsXtoY(!isXtoY);
  };

  return (
    <div className="flex items-center gap-2">
      {isXtoY ? priceXtoY : priceYtoX}{" "}
      <button
        className="inline-flex cursor-pointer items-center justify-center text-green-300 hover:opacity-80"
        onClick={handleClick}
        type="button"
      >
        <Icon className="size-6 rotate-90" name="swap" />
      </button>
    </div>
  );
}
