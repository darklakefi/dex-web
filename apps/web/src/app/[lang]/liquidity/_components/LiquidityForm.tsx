"use client";

import { Box, Icon } from "@dex-web/ui";
import { useRouter } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { EMPTY_TOKEN, LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityErrorBoundary } from "./LiquidityErrorBoundary";
import {
  LiquidityFormProvider,
  useLiquidityFormWithDebounced,
} from "./LiquidityFormProvider";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";

const serialize = createSerializer(liquidityPageParsers);

function LiquidityFormContent() {
  const router = useRouter();
  const {
    form,
    poolDetails,
    slippage,
    setSlippage,
    debouncedCalculateTokenAmounts,
    tokenAccountsData,
    tokenAAddress,
    tokenBAddress,
    publicKey,
  } = useLiquidityFormWithDebounced();

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
      tokenAAddress: EMPTY_TOKEN,
      tokenBAddress: EMPTY_TOKEN,
      type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
    });
    router.push(`/${urlWithParams}`);
  };

  const shouldShowAddLiquidityDetails =
    poolDetails &&
    form.state.values.tokenBAmount !== "0" &&
    form.state.values.tokenAAmount !== "0";

  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <div className="flex flex-col gap-4">
          <LiquidityTokenInputs
            buyTokenAccount={tokenAccountsData.buyTokenAccount}
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
            isPoolLoading={false}
            isTokenAccountsLoading={
              tokenAccountsData.isLoadingBuy || tokenAccountsData.isLoadingSell
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
            tokenBAmount={form.state.values.tokenBAmount}
            tokenBSymbol={
              tokenAccountsData.sellTokenAccount?.tokenAccounts?.[0]?.symbol ||
              ""
            }
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
  );
}

export function LiquidityForm() {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  return (
    <LiquidityErrorBoundary>
      <LiquidityFormProvider
        tokenAAddress={tokenAAddress}
        tokenBAddress={tokenBAddress}
      >
        <LiquidityFormContent />
      </LiquidityFormProvider>
    </LiquidityErrorBoundary>
  );
}
