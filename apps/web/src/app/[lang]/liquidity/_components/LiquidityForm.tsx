"use client";

import { Box, Icon } from "@dex-web/ui";
import { Decimal } from "decimal.js";
import { useRouter } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { useLiquidityFormLogic } from "../_hooks/useLiquidityFormLogic";
import { useLPTokenEstimation } from "../_hooks/useLPTokenEstimation";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { CalculationLoadingIndicator } from "./CalculationLoadingIndicator";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityErrorBoundary } from "./LiquidityErrorBoundary";
import {
  LiquidityFormSkeleton,
  PoolDetailsSkeleton,
} from "./LiquidityFormSkeletons";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";

const serialize = createSerializer(liquidityPageParsers);

export function LiquidityForm() {
  const router = useRouter();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const {
    form,
    poolDetails,
    slippage,
    setSlippage,
    tokenAccountsData,
    publicKey,
    isCalculating,
    isError,
    isPoolLoading,
  } = useLiquidityFormLogic({
    tokenAAddress,
    tokenBAddress,
  });

  // Use LP estimation hook for accurate calculations with fee/locked amount exclusions
  const lpEstimation = useLPTokenEstimation({
    enabled: Boolean(poolDetails && tokenAAddress && tokenBAddress),
    slippage,
    tokenAAddress,
    tokenAAmount: form.state.values.tokenAAmount || "0",
    tokenBAddress,
    tokenBAmount: form.state.values.tokenBAmount || "0",
  });

  const debouncedCalculateTokenAmounts = (
    params: {
      inputAmount: string;
      editedToken: "tokenA" | "tokenB";
      tokenAAddress: string | null;
      tokenBAddress: string | null;
    },
    onResult: (outputAmount: number | null) => void,
  ) => {
    if (
      !poolDetails ||
      !poolDetails.tokenXReserve ||
      !poolDetails.tokenYReserve
    ) {
      onResult(null);
      return;
    }

    try {
      const amount = new Decimal(params.inputAmount);
      if (amount.isNaN() || amount.lte(0)) {
        onResult(null);
        return;
      }

      const tokenAIsX = params.tokenAAddress === poolDetails.tokenXMint;

      const reserveX = new Decimal(poolDetails.tokenXReserve);
      const reserveY = new Decimal(poolDetails.tokenYReserve);

      let result: Decimal;

      if (params.editedToken === "tokenA") {
        result = tokenAIsX
          ? amount.mul(reserveY).div(reserveX)
          : amount.mul(reserveX).div(reserveY);
      } else {
        result = tokenAIsX
          ? amount.mul(reserveX).div(reserveY)
          : amount.mul(reserveY).div(reserveX);
      }

      onResult(Number(result.toFixed(6, Decimal.ROUND_DOWN)));
    } catch (error) {
      console.error("Error calculating proportional amount:", error);
      onResult(null);
    }
  };

  const handleSlippageChange = (newSlippage: string) => {
    setSlippage(newSlippage);
  };

  const handleCreatePoolClick = () => {
    const urlWithParams = serialize("liquidity", {
      type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
    });
    router.push(`/${urlWithParams}`);
  };

  const shouldShowAddLiquidityDetails =
    poolDetails &&
    form.state.values.tokenBAmount !== "0" &&
    form.state.values.tokenAAmount !== "0";

  const isInitialLoading =
    !tokenAAddress ||
    !tokenBAddress ||
    (tokenAccountsData.isLoadingBuy && tokenAccountsData.isLoadingSell) ||
    isPoolLoading;

  if (isInitialLoading) {
    return (
      <LiquidityErrorBoundary>
        <LiquidityFormSkeleton />
      </LiquidityErrorBoundary>
    );
  }

  return (
    <LiquidityErrorBoundary>
      <section className="flex w-full max-w-xl items-start gap-1">
        <div className="size-9" />

        <Box padding="lg">
          <div className="flex flex-col gap-4">
            <LiquidityTokenInputs
              buyTokenAccount={tokenAccountsData.buyTokenAccount}
              debouncedCalculateTokenAmounts={debouncedCalculateTokenAmounts}
              form={form}
              isLoadingBuy={tokenAccountsData.isLoadingBuy}
              isLoadingSell={tokenAccountsData.isLoadingSell}
              isRefreshingBuy={tokenAccountsData.isRefreshingBuy}
              isRefreshingSell={tokenAccountsData.isRefreshingSell}
              poolDetails={poolDetails}
              sellTokenAccount={tokenAccountsData.sellTokenAccount}
              tokenAAddress={tokenAAddress}
              tokenBAddress={tokenBAddress}
            />

            {isCalculating && <CalculationLoadingIndicator />}

            <LiquidityActionButton
              buyTokenAccount={tokenAccountsData.buyTokenAccount}
              form={form}
              isError={isError}
              isPoolLoading={isPoolLoading}
              isTokenAccountsLoading={
                tokenAccountsData.isLoadingBuy ||
                tokenAccountsData.isLoadingSell
              }
              onSubmit={() => {
                form.handleSubmit();
              }}
              poolDetails={poolDetails}
              publicKey={publicKey}
              sellTokenAccount={tokenAccountsData.sellTokenAccount}
              tokenAAddress={tokenAAddress}
              tokenBAddress={tokenBAddress}
            />
          </div>

          {shouldShowAddLiquidityDetails &&
            (isCalculating ? (
              <PoolDetailsSkeleton />
            ) : (
              <AddLiquidityDetails
                estimatedLPTokens={
                  lpEstimation.data?.estimatedLPTokens || undefined
                }
                isLPEstimationLoading={lpEstimation.isLoading}
                slippage={slippage}
                tokenAAmount={form.state.values.tokenAAmount}
                tokenASymbol={
                  tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]
                    ?.symbol || ""
                }
                tokenBAddress={tokenBAddress ?? ""}
                tokenBAmount={form.state.values.tokenBAmount}
                tokenBSymbol={
                  tokenAccountsData.sellTokenAccount?.tokenAccounts?.[0]
                    ?.symbol || ""
                }
                tokenXMint={poolDetails?.tokenXMint}
                tokenXReserve={poolDetails?.tokenXReserve}
                tokenYReserve={poolDetails?.tokenYReserve}
              />
            ))}
        </Box>

        <div className="flex flex-col gap-1">
          <TokenTransactionSettingsButton onChange={handleSlippageChange} />

          <button
            aria-label="change mode"
            className="inline-flex cursor-pointer items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
            onClick={handleCreatePoolClick}
            type="button"
          >
            <Icon className={`size-5`} name="plus-circle" />
          </button>
        </div>
      </section>
    </LiquidityErrorBoundary>
  );
}
