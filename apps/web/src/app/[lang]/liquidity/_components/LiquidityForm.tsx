"use client";

import { Box, Icon } from "@dex-web/ui";
import {
  type CalculateProportionalAmountParams,
  calculateProportionalAmount,
} from "@dex-web/utils";
import { Field } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { FORM_FIELD_NAMES } from "../_constants/liquidityConstants";
import { useLiquidityFormLogic } from "../_hooks/useLiquidityFormLogic";
import { useLPTokenEstimation } from "../_hooks/useLPTokenEstimation";
import {
  createPoolUrl,
  selectLiquidityViewState,
} from "../_utils/liquiditySelectors";
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
    tokenAccountsData,
    publicKey,
    isCalculating,
    isError,
    isPoolLoading,
    isSubmitting,
    isSuccess,
    send,
  } = useLiquidityFormLogic({
    tokenAAddress,
    tokenBAddress,
  });

  const viewState = selectLiquidityViewState(
    poolDetails,
    form.state.values.tokenAAmount,
    form.state.values.tokenBAmount,
    tokenAAddress,
    tokenBAddress,
    tokenAccountsData,
    isPoolLoading,
  );

  const lpEstimation = useLPTokenEstimation({
    enabled: Boolean(poolDetails && tokenAAddress && tokenBAddress),
    slippage: form.state.values.slippage,
    tokenAAddress,
    tokenAAmount: form.state.values.tokenAAmount || "0",
    tokenBAddress,
    tokenBAmount: form.state.values.tokenBAmount || "0",
  });

  if (viewState.isInitialLoading) {
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
          <form
            onSubmit={(e) => {
              console.log("🎯 Form onSubmit event fired");
              e.preventDefault();
              e.stopPropagation();
              console.log("📋 Calling form.handleSubmit()");
              form.handleSubmit();
              console.log("✅ form.handleSubmit() completed");
            }}
          >
            <div className="flex flex-col gap-4">
              <LiquidityTokenInputs
                buyTokenAccount={tokenAccountsData.buyTokenAccount}
                calculateProportionalAmount={(
                  params: Omit<
                    CalculateProportionalAmountParams,
                    "poolDetails"
                  >,
                ) => {
                  if (!poolDetails) return null;
                  return calculateProportionalAmount({
                    ...params,
                    poolDetails,
                  });
                }}
                form={form}
                isDisabled={isSuccess || isError}
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
                isCalculating={isCalculating}
                isError={isError}
                isPoolLoading={isPoolLoading}
                isSubmitting={isSubmitting}
                isSuccess={isSuccess}
                isTokenAccountsLoading={
                  tokenAccountsData.isLoadingBuy ||
                  tokenAccountsData.isLoadingSell
                }
                onReset={() => send({ type: "RESET" })}
                poolDetails={poolDetails}
                publicKey={publicKey}
                sellTokenAccount={tokenAccountsData.sellTokenAccount}
                tokenAAddress={tokenAAddress}
                tokenBAddress={tokenBAddress}
              />
            </div>
          </form>

          {viewState.shouldShowAddLiquidityDetails &&
            (isCalculating ? (
              <PoolDetailsSkeleton />
            ) : (
              <AddLiquidityDetails
                estimatedLPTokens={
                  lpEstimation.data?.estimatedLPTokens || undefined
                }
                isLPEstimationLoading={lpEstimation.isLoading}
                slippage={form.state.values.slippage || "0.5"}
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
          <Field form={form} name={FORM_FIELD_NAMES.SLIPPAGE}>
            {(field) => (
              <TokenTransactionSettingsButton
                onChange={(newSlippage) => field.handleChange(newSlippage)}
              />
            )}
          </Field>

          <button
            aria-label="change mode"
            className="inline-flex cursor-pointer items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
            onClick={() =>
              router.push(
                createPoolUrl(
                  serialize,
                  LIQUIDITY_PAGE_TYPE.CREATE_POOL,
                ) as any,
              )
            }
            type="button"
          >
            <Icon className={`size-5`} name="plus-circle" />
          </button>
        </div>
      </section>
    </LiquidityErrorBoundary>
  );
}
