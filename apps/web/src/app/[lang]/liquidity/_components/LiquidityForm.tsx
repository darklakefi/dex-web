"use client";

import { Box, Icon } from "@dex-web/ui";
import {
  type CalculateProportionalAmountParams,
  calculateProportionalAmount,
} from "@dex-web/utils";
import { Field, useStore } from "@tanstack/react-form";
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
import { useTokenOrder } from "../_hooks/useTokenOrder";
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
    isPoolLoading,
    isSubmitting,
    send,
  } = useLiquidityFormLogic({
    tokenAAddress,
    tokenBAddress,
  });

  const tokenAAmount = useStore(
    form.store,
    (state) => state.values[FORM_FIELD_NAMES.TOKEN_A_AMOUNT] || "0",
  );
  const tokenBAmount = useStore(
    form.store,
    (state) => state.values[FORM_FIELD_NAMES.TOKEN_B_AMOUNT] || "0",
  );
  const slippage = useStore(
    form.store,
    (state) => state.values[FORM_FIELD_NAMES.SLIPPAGE] || "0.5",
  );

  const viewState = selectLiquidityViewState(
    poolDetails ?? null,
    tokenAAmount,
    tokenBAmount,
    tokenAAddress,
    tokenBAddress,
    tokenAccountsData,
    isPoolLoading,
  );

  const tokenADecimals =
    tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]?.decimals ?? 0;
  const tokenBDecimals =
    tokenAccountsData.sellTokenAccount?.tokenAccounts?.[0]?.decimals ?? 0;

  const orderContext = useTokenOrder();

  const lpEstimation = useLPTokenEstimation({
    enabled: !!poolDetails && !!orderContext,
    orderContext,
    slippage,
    tokenAAmount,
    tokenADecimals,
    tokenBAmount,
    tokenBDecimals,
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
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-4">
              <LiquidityTokenInputs
                buyTokenAccount={tokenAccountsData.buyTokenAccount}
                calculateProportionalAmount={(
                  params: Omit<
                    CalculateProportionalAmountParams,
                    "poolDetails" | "tokenADecimals" | "tokenBDecimals"
                  >,
                ) => {
                  if (!poolDetails) return null;
                  return calculateProportionalAmount({
                    ...params,
                    poolDetails,
                    tokenADecimals,
                    tokenBDecimals,
                  });
                }}
                form={form}
                isDisabled={false}
                isLoadingBuy={tokenAccountsData.isLoadingBuy}
                isLoadingSell={tokenAccountsData.isLoadingSell}
                isRefreshingBuy={tokenAccountsData.isRefreshingBuy}
                isRefreshingSell={tokenAccountsData.isRefreshingSell}
                poolDetails={poolDetails ?? null}
                sellTokenAccount={tokenAccountsData.sellTokenAccount}
                tokenAAddress={tokenAAddress}
                tokenBAddress={tokenBAddress}
              />

              {isCalculating && <CalculationLoadingIndicator />}

              <LiquidityActionButton
                buyTokenAccount={tokenAccountsData.buyTokenAccount}
                form={form}
                isCalculating={isCalculating}
                isPoolLoading={isPoolLoading}
                isSubmitting={isSubmitting}
                isTokenAccountsLoading={
                  tokenAccountsData.isLoadingBuy ||
                  tokenAccountsData.isLoadingSell
                }
                poolDetails={poolDetails ?? null}
                publicKey={publicKey}
                sellTokenAccount={tokenAccountsData.sellTokenAccount}
                send={send}
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
                estimatedLPTokens={lpEstimation.data?.estimatedLPTokens || ""}
                form={form}
                isLPEstimationLoading={lpEstimation.isLoading}
                tokenASymbol={
                  tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]
                    ?.symbol || ""
                }
                tokenBAddress={tokenBAddress ?? ""}
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
            onClick={() => {
              const url = createPoolUrl(
                serialize,
                LIQUIDITY_PAGE_TYPE.CREATE_POOL,
              );
              router.push(url as Parameters<typeof router.push>[0]);
            }}
            type="button"
          >
            <Icon className={`size-5`} name="plus-circle" />
          </button>
        </div>
      </section>
    </LiquidityErrorBoundary>
  );
}
