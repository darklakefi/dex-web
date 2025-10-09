import { Box, Icon, Text } from "@dex-web/ui";
import { numberFormatHelper } from "@dex-web/utils";
import { useStore } from "@tanstack/react-form";
import BigNumber from "bignumber.js";
import { useState } from "react";
import { FORM_FIELD_NAMES } from "../_constants/liquidityConstants";
import type { LiquidityFormApi } from "../_hooks/useLiquidityFormState";

export type AddLiquidityDetailsProps = {
  form: LiquidityFormApi;
  tokenBSymbol: string;
  tokenASymbol: string;
  tokenXReserve?: number;
  tokenYReserve?: number;
  tokenXMint?: string;
  tokenBAddress?: string;
  estimatedLPTokens?: string;
  isLPEstimationLoading?: boolean;
};

export function AddLiquidityDetails({
  form,
  tokenBSymbol,
  tokenASymbol,
  tokenXReserve,
  tokenYReserve,
  tokenXMint,
  tokenBAddress,
  estimatedLPTokens,
  isLPEstimationLoading,
}: AddLiquidityDetailsProps) {
  const tokenAAmount = useStore(
    form.store,
    (state) => state.values[FORM_FIELD_NAMES.TOKEN_A_AMOUNT] || "",
  );
  const tokenBAmount = useStore(
    form.store,
    (state) => state.values[FORM_FIELD_NAMES.TOKEN_B_AMOUNT] || "",
  );
  const slippage = useStore(
    form.store,
    (state) => state.values[FORM_FIELD_NAMES.SLIPPAGE] || "0.5",
  );

  const [isAtoB, setIsAtoB] = useState(true);

  let rateBtoA: BigNumber;
  let rateAtoB: BigNumber;

  if (
    tokenXReserve &&
    tokenYReserve &&
    tokenXMint &&
    tokenBAddress &&
    tokenXReserve > 0 &&
    tokenYReserve > 0
  ) {
    if (tokenXMint === tokenBAddress) {
      rateBtoA = BigNumber(tokenYReserve).dividedBy(tokenXReserve);
      rateAtoB = BigNumber(tokenXReserve).dividedBy(tokenYReserve);
    } else {
      rateBtoA = BigNumber(tokenXReserve).dividedBy(tokenYReserve);
      rateAtoB = BigNumber(tokenYReserve).dividedBy(tokenXReserve);
    }
  } else if (
    tokenAAmount &&
    tokenBAmount &&
    !BigNumber(tokenAAmount).isZero() &&
    !BigNumber(tokenBAmount).isZero()
  ) {
    rateBtoA = BigNumber(tokenBAmount).dividedBy(tokenAAmount);
    rateAtoB = BigNumber(tokenAAmount).dividedBy(tokenBAmount);
  } else {
    rateBtoA = BigNumber(0);
    rateAtoB = BigNumber(0);
  }

  const hasValues =
    (tokenAAmount && BigNumber(tokenAAmount).gt(0)) ||
    (tokenBAmount && BigNumber(tokenBAmount).gt(0));

  const priceAtoB = `1 ${tokenASymbol} ≈ ${numberFormatHelper({
    decimalScale: 5,
    thousandSeparator: true,
    trimTrailingZeros: true,
    value: rateAtoB,
  })} ${tokenBSymbol}`;

  const priceBtoA = `1 ${tokenBSymbol} ≈ ${numberFormatHelper({
    decimalScale: 5,
    thousandSeparator: true,
    trimTrailingZeros: true,
    value: rateBtoA,
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
            {tokenBAmount && BigNumber(tokenBAmount).gt(0)
              ? numberFormatHelper({
                  decimalScale: 5,
                  trimTrailingZeros: true,
                  value: tokenBAmount,
                })
              : "0"}{" "}
            {tokenBSymbol || "—"}
          </Text.Body2>
          <Text.Body2 className="text-green-200">
            {tokenAAmount && BigNumber(tokenAAmount).gt(0)
              ? numberFormatHelper({
                  decimalScale: 5,
                  trimTrailingZeros: true,
                  value: tokenAAmount,
                })
              : "0"}{" "}
            {tokenASymbol || "—"}
          </Text.Body2>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pt-4">
          <Text.Body2 className="text-green-300">Pool Price</Text.Body2>
          <div className="flex items-center gap-1">
            <Text.Body2 className="text-green-200">
              {hasValues ? (isAtoB ? priceAtoB : priceBtoA) : "—"}
            </Text.Body2>
            {hasValues && (
              <button
                className="inline-flex cursor-pointer items-center justify-center text-green-300 hover:opacity-80"
                onClick={handleClick}
                type="button"
              >
                <Icon className="size-6 rotate-90" name="swap" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Text.Body2 className="text-green-300">Slippage Tolerance</Text.Body2>
          <Text.Body2 className="text-green-200">{slippage}%</Text.Body2>
        </div>

        <div className="flex items-center justify-between">
          <Text.Body2 className="text-green-300">
            Estimated LP Tokens
          </Text.Body2>
          <Text.Body2 className="text-green-200">
            {isLPEstimationLoading
              ? "Calculating..."
              : estimatedLPTokens
                ? numberFormatHelper({
                    decimalScale: 6,
                    trimTrailingZeros: true,
                    value: estimatedLPTokens,
                  })
                : "—"}
          </Text.Body2>
        </div>
      </div>
    </Box>
  );
}
