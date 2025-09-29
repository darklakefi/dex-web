"use client";

import { Box, Button, Icon } from "@dex-web/ui";
import { useRouter } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import React, { useActionState, useOptimistic, startTransition } from "react";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import {
  EMPTY_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "../../../_utils/constants";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityErrorBoundary } from "./LiquidityErrorBoundary";
import { LiquidityFormProvider, useLiquidityFormWithDebounced } from "./LiquidityFormProvider";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";
import { LiquidityTransactionStatus } from "./LiquidityTransactionStatus";
import {
  submitLiquidityAction,
  type LiquidityFormState
} from "../_actions/submitLiquidityAction";
import { useWalletPublicKey } from "../../../../hooks/useWalletCache";

const serialize = createSerializer(liquidityPageParsers);

type OptimisticUpdate = {
  isSubmitting: boolean;
  lastAttempt?: Date;
};

function LiquidityFormContent() {
  const router = useRouter();
  const { data: publicKey } = useWalletPublicKey();

  const {
    form,
    poolDetails,
    slippage,
    setSlippage,
    debouncedCalculateTokenAmounts,
    tokenAccountsData,
    tokenAAddress,
    tokenBAddress,
  } = useLiquidityFormWithDebounced();

  // Server Action state management
  const initialState: LiquidityFormState = { success: false };
  const [state, formAction] = useActionState(submitLiquidityAction, initialState);

  // Optimistic updates for better UX
  const [optimisticUpdate, addOptimistic] = useOptimistic(
    { isSubmitting: false },
    (currentState: OptimisticUpdate, newState: OptimisticUpdate) => ({
      ...currentState,
      ...newState,
    })
  );

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

  // Enhanced form submission that supports both Server Actions and client-side logic
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Add current form values to FormData
    formData.set("tokenAAmount", form.state.values.tokenAAmount);
    formData.set("tokenBAmount", form.state.values.tokenBAmount);
    formData.set("tokenAAddress", tokenAAddress || "");
    formData.set("tokenBAddress", tokenBAddress || "");
    formData.set("slippage", slippage);
    formData.set("userAddress", publicKey?.toBase58() || "");

    // Optimistic update
    startTransition(() => {
      addOptimistic({
        isSubmitting: true,
        lastAttempt: new Date()
      });
    });

    // Call Server Action
    startTransition(() => {
      formAction(formData);
    });
  };

  // Handle successful transaction creation from Server Action
  React.useEffect(() => {
    if (state.success && state.transaction) {
      // Use existing client-side transaction signing logic
      // This maintains compatibility with existing wallet integration
      form.handleSubmit();
    }
  }, [state.success, state.transaction, form]);

  const shouldShowAddLiquidityDetails = poolDetails &&
    form.state.values.tokenBAmount !== "0" &&
    form.state.values.tokenAAmount !== "0";

  const isSubmitting = optimisticUpdate.isSubmitting ||
    (state.success === undefined && optimisticUpdate.lastAttempt);

  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <form onSubmit={handleFormSubmit}>
          <div className="flex flex-col gap-4">
            <LiquidityTokenInputs
              form={form}
              buyTokenAccount={tokenAccountsData.buyTokenAccount}
              sellTokenAccount={tokenAccountsData.sellTokenAccount}
              isLoadingBuy={tokenAccountsData.isLoadingBuy}
              isLoadingSell={tokenAccountsData.isLoadingSell}
              isRefreshingBuy={tokenAccountsData.isRefreshingBuy}
              isRefreshingSell={tokenAccountsData.isRefreshingSell}
              tokenAAddress={tokenAAddress}
              tokenBAddress={tokenBAddress}
              poolDetails={poolDetails}
            />

            {/* Hidden inputs for Server Action */}
            <input type="hidden" name="tokenAAddress" value={tokenAAddress || ""} />
            <input type="hidden" name="tokenBAddress" value={tokenBAddress || ""} />
            <input type="hidden" name="slippage" value={slippage} />
            <input type="hidden" name="userAddress" value={publicKey?.toBase58() || ""} />

            {/* Server Action errors */}
            {state.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {state.error}
              </div>
            )}

            {/* Field-specific errors */}
            {state.fieldErrors && Object.entries(state.fieldErrors).map(([field, errors]) => (
              <div key={field} className="text-red-600 text-sm">
                {field}: {errors?.join(", ")}
              </div>
            ))}

            <LiquidityActionButton
              publicKey={publicKey}
              buyTokenAccount={tokenAccountsData.buyTokenAccount}
              sellTokenAccount={tokenAccountsData.sellTokenAccount}
              poolDetails={poolDetails}
              tokenAAddress={tokenAAddress}
              tokenBAddress={tokenBAddress}
              isPoolLoading={false}
              isTokenAccountsLoading={tokenAccountsData.isLoadingBuy || tokenAccountsData.isLoadingSell}
              onSubmit={() => {
                // This will now trigger the form submission
                // which includes Server Action processing
              }}
              disabled={isSubmitting}
            />

            <LiquidityTransactionStatus />
          </div>
        </form>

        {shouldShowAddLiquidityDetails && (
          <AddLiquidityDetails
            slippage={slippage}
            tokenAAmount={form.state.values.tokenAAmount}
            tokenASymbol={tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]?.symbol || ""}
            tokenBAmount={form.state.values.tokenBAmount}
            tokenBSymbol={tokenAccountsData.sellTokenAccount?.tokenAccounts?.[0]?.symbol || ""}
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

export function LiquidityFormEnhanced() {
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

/**
 * Progressive enhancement wrapper component.
 *
 * This component detects if JavaScript is available and renders
 * the appropriate version of the form:
 * - With JS: Enhanced form with optimistic updates
 * - Without JS: Basic form that works with Server Actions only
 */
export function ProgressiveEnhancedLiquidityForm() {
  const [hasJS, setHasJS] = React.useState(false);

  React.useEffect(() => {
    setHasJS(true);
  }, []);

  if (!hasJS) {
    // Server-side render or no JS: use basic form
    return <LiquidityFormServerOnly />;
  }

  // Client-side with JS: use enhanced form
  return <LiquidityFormEnhanced />;
}

/**
 * Server-only form component that works without JavaScript.
 * This provides the baseline functionality using only Server Actions.
 */
function LiquidityFormServerOnly() {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const initialState: LiquidityFormState = { success: false };
  const [state, formAction] = useActionState(submitLiquidityAction, initialState);

  return (
    <LiquidityErrorBoundary>
      <section className="flex w-full max-w-xl items-start gap-1">
        <div className="size-9" />

        <Box padding="lg">
          <form action={formAction}>
            <div className="flex flex-col gap-4">
              {/* Basic form inputs */}
              <div>
                <label htmlFor="tokenAAmount">Token A Amount</label>
                <input
                  type="number"
                  id="tokenAAmount"
                  name="tokenAAmount"
                  step="any"
                  min="0"
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label htmlFor="tokenBAmount">Token B Amount</label>
                <input
                  type="number"
                  id="tokenBAmount"
                  name="tokenBAmount"
                  step="any"
                  min="0"
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <input type="hidden" name="tokenAAddress" value={tokenAAddress || ""} />
              <input type="hidden" name="tokenBAddress" value={tokenBAddress || ""} />
              <input type="hidden" name="slippage" value="0.5" />

              {state.error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {state.error}
                </div>
              )}

              {state.success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  Transaction created successfully. Please sign with your wallet.
                </div>
              )}

              <Button type="submit">
                Add Liquidity
              </Button>
            </div>
          </form>
        </Box>
      </section>
    </LiquidityErrorBoundary>
  );
}