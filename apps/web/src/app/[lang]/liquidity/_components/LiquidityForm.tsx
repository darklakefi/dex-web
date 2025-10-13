"use client";

import type { GetTokenPriceOutput } from "@dex-web/orpc/schemas/index";
import { Box, Icon } from "@dex-web/ui";
import {
  type CalculateProportionalAmountParams,
  calculateProportionalAmount,
} from "@dex-web/utils";
import { Field, useStore } from "@tanstack/react-form";
import { useQueryStates } from "nuqs";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { liquidityPageParsers } from "../../../_utils/searchParams";
import { FORM_FIELD_NAMES } from "../_constants/liquidityConstants";
import { useLiquidityFormLogic } from "../_hooks/useLiquidityFormLogic";
import { useLPTokenEstimation } from "../_hooks/useLPTokenEstimation";
import { useTokenOrder } from "../_hooks/useTokenOrder";
import { selectLiquidityViewState } from "../_utils/liquiditySelectors";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityErrorBoundary } from "./LiquidityErrorBoundary";
import {
  LiquidityFormSkeleton,
  PoolDetailsSkeleton,
} from "./LiquidityFormSkeletons";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";

interface LiquidityFormProps {
  tokenPrices?: Record<string, GetTokenPriceOutput | undefined>;
}

export function LiquidityForm({ tokenPrices = {} }: LiquidityFormProps) {
  const [{ tokenAAddress, tokenBAddress }, setLiquidityParams] =
    useQueryStates(liquidityPageParsers);

  const {
    form,
    poolDetails,
    tokenAccountsData,
    publicKey,
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
    tokenAccountsData.tokenAAccount?.tokenAccounts?.[0]?.decimals ?? 0;
  const tokenBDecimals =
    tokenAccountsData.tokenBAccount?.tokenAccounts?.[0]?.decimals ?? 0;

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

  const isCalculating = lpEstimation.isLoading;

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

              if (!poolDetails) {
                return;
              }
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-4">
              <LiquidityTokenInputs
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
                isLoadingBuy={tokenAccountsData.isLoadingBuy}
                isLoadingSell={tokenAccountsData.isLoadingSell}
                isRefreshingBuy={tokenAccountsData.isRefreshingBuy}
                isRefreshingSell={tokenAccountsData.isRefreshingSell}
                poolDetails={poolDetails ?? null}
                tokenAAccount={tokenAccountsData.tokenAAccount}
                tokenAAddress={tokenAAddress}
                tokenBAccount={tokenAccountsData.tokenBAccount}
                tokenBAddress={tokenBAddress}
                tokenPrices={tokenPrices}
              />

              <LiquidityActionButton
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
                send={send}
                tokenAAccount={tokenAccountsData.tokenAAccount}
                tokenAAddress={tokenAAddress}
                tokenBAccount={tokenAccountsData.tokenBAccount}
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
                  tokenAccountsData.tokenAAccount?.tokenAccounts?.[0]?.symbol ||
                  ""
                }
                tokenBAddress={tokenBAddress ?? ""}
                tokenBSymbol={
                  tokenAccountsData.tokenBAccount?.tokenAccounts?.[0]?.symbol ||
                  ""
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
            onClick={async () => {
              await setLiquidityParams({
                tokenAAddress,
                tokenBAddress,
                type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
              });
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
