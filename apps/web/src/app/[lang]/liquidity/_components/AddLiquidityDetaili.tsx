import { Box, Icon, Text } from "@dex-web/ui";
import { numberFormatHelper } from "@dex-web/utils";
import BigNumber from "bignumber.js";
import { useState } from "react";

export type AddLiquidityDetailsProps = {
  tokenBAmount: string;
  tokenBSymbol: string;
  tokenAAmount: string;
  tokenASymbol: string;
  slippage: string;
};

export function AddLiquidityDetails({
  tokenBAmount,
  tokenBSymbol,
  tokenAAmount,
  tokenASymbol,
  slippage,
}: AddLiquidityDetailsProps) {
  const rateBtoA = BigNumber(tokenBAmount).dividedBy(tokenAAmount);
  const rateAtoB = BigNumber(tokenAAmount).dividedBy(tokenBAmount);
  const [isAtoB, setIsAtoB] = useState(true);

  const rate = isAtoB ? rateAtoB : rateBtoA;

  const priceAtoB = `1 ${tokenASymbol} ≈ ${numberFormatHelper({
    decimalScale: 5,
    thousandSeparator: true,
    trimTrailingZeros: true,
    value: rate,
  })} ${tokenBSymbol}`;

  const priceBtoA = `1 ${tokenBSymbol} ≈ ${numberFormatHelper({
    decimalScale: 5,
    thousandSeparator: true,
    trimTrailingZeros: true,
    value: rate,
  })} ${tokenASymbol}`;

  const handleClick = () => {
    setIsAtoB(!isAtoB);
  };

  return (
    <Box className="gap-1 bg-green-600 py-3">
      <div className="flex items-center justify-between border-green-500 border-b pb-4">
        <Text.Body2 className="text-green-300">Total Deposit</Text.Body2>
        <div className="text-right">
          <Text.Body2 className="text-green-200">
            {numberFormatHelper({
              decimalScale: 5,
              trimTrailingZeros: true,
              value: tokenBAmount,
            })}{" "}
            {tokenBSymbol}
          </Text.Body2>
          <Text.Body2 className="text-green-200">
            {numberFormatHelper({
              decimalScale: 5,
              trimTrailingZeros: true,
              value: tokenAAmount,
            })}{" "}
            {tokenASymbol}
          </Text.Body2>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pt-4">
          <Text.Body2 className="text-green-300">Pool Price</Text.Body2>
          <div className="flex items-center gap-1">
            <Text.Body2 className="text-green-200">
              {isAtoB ? priceAtoB : priceBtoA}{" "}
            </Text.Body2>
            <button
              className="inline-flex cursor-pointer items-center justify-center text-green-300 hover:opacity-80"
              onClick={handleClick}
              type="button"
            >
              <Icon className="size-6 rotate-90" name="swap" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Text.Body2 className="text-green-300">Slippage Tolerance</Text.Body2>
          <Text.Body2 className="text-green-200">{slippage}%</Text.Body2>
        </div>
      </div>
    </Box>
  );
}
