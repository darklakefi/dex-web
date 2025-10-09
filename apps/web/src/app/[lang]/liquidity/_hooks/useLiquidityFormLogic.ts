"use client";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import type { LiquidityFormValues } from "../_types/liquidity.types";
import { useLiquidityFormState } from "./useLiquidityFormState";
import { useLiquidityTransaction } from "./useLiquidityTransaction";

interface UseLiquidityFormLogicProps {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}

export function useLiquidityFormLogic({
  tokenAAddress,
  tokenBAddress,
}: UseLiquidityFormLogicProps) {
  const { publicKey } = useWallet();

  // Pure function - no useMemo needed, sortSolanaAddresses is deterministic
  const sortedTokenAddresses = sortSolanaAddresses(
    tokenAAddress || "",
    tokenBAddress || "",
  );
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const poolDataResult = useRealtimePoolData({ tokenXMint, tokenYMint });

  // Data is already transformed by query's select option (Answer #5 best practice)
  // The query only triggers re-renders when the transformed PoolDetails changes
  const poolDetails = poolDataResult.data;

  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction: false,
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  // Create transaction first (needed for send function)
  // Note: We pass a dummy reset for now, will wire it up after form is created
  const transaction = useLiquidityTransaction({
    poolDetails,
    resetForm: () => {
      // Will be set below after form is created
    },
    tokenAAddress,
    tokenBAddress,
  });

  // Wire up form submission to XState machine
  // Following Answer #3: TanStack Form validates → XState executes
  const handleFormSubmit = useCallback(
    ({ value }: { value: LiquidityFormValues }) => {
      console.log("🔥 handleFormSubmit called with value:", value);
      if (transaction.isError) {
        console.log("🔄 Retrying transaction...");
        transaction.send({ type: "RETRY" });
      } else {
        console.log("📤 Sending SUBMIT event to XState machine");
        transaction.send({ data: value, type: "SUBMIT" });
      }
    },
    [transaction.isError, transaction.send],
  );

  // Create form with the correct onSubmit handler
  const { form } = useLiquidityFormState({
    onSubmit: handleFormSubmit,
    tokenAccountsData,
    walletPublicKey: publicKey || null,
  });

  return {
    form,
    isCalculating: transaction.isCalculating,
    isError: transaction.isError,
    isPoolLoading: poolDataResult.isLoading,
    isSubmitting: transaction.isSubmitting,
    isSuccess: transaction.isSuccess,
    poolDetails,
    publicKey,
    tokenAccountsData,
  };
}
