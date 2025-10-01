"use client";

import { Box, Icon } from "@dex-web/ui";
import { useRouter } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityErrorBoundary } from "./LiquidityErrorBoundary";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";
import { useLiquidityFormLogic } from "./useLiquidityFormLogic";

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
    debouncedCalculateTokenAmounts,
    tokenAccountsData,
    publicKey,
  } = useLiquidityFormLogic({
    tokenAAddress,
    tokenBAddress,
  });

  const handleSlippageChange = (newSlippage: string) => {
    setSlippage(newSlippage);
    if (form.state.values.tokenBAmount !== "0") {
      const inputType =
        poolDetails?.tokenXMint === tokenBAddress ? "tokenX" : "tokenY";
      debouncedCalculateTokenAmounts({
        inputAmount: form.state.values.tokenBAmount,
        inputType,
      });
    }
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
            <LiquidityActionButton
              buyTokenAccount={tokenAccountsData.buyTokenAccount}
              form={form}
              isPoolLoading={false}
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

          {shouldShowAddLiquidityDetails && (
            <AddLiquidityDetails
              slippage={slippage}
              tokenAAmount={form.state.values.tokenAAmount}
              tokenASymbol={
                tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]?.symbol ||
                ""
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
          )}
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
