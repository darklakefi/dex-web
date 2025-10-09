"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRef } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import type { LiquidityFormValues } from "../_types/liquidity.types";
import { useLiquidityFormState } from "./useLiquidityFormState";
import { useLiquidityTransaction } from "./useLiquidityTransaction";
import { useTokenOrder } from "./useTokenOrder";

interface UseLiquidityFormLogicProps {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}

/**
 * Coordinator hook for liquidity forms.
 * Following Answer #1: Inversion of Control pattern
 *
 * Data flow: Form → Logic Hook (orchestrator) → Transaction Hook
 * - Form manages field state and validation
 * - Transaction manages submission workflow and XState machine
 * - This hook orchestrates the interaction between them
 *
 * Token ordering: Uses useTokenOrder to derive token order from URL params (via nuqs).
 * This ensures a single source of truth and eliminates duplicate sorting logic.
 */
export function useLiquidityFormLogic({
  tokenAAddress,
  tokenBAddress,
}: UseLiquidityFormLogicProps) {
  const { publicKey } = useWallet();

  const orderContext = useTokenOrder();

  const tokenXMint = orderContext?.protocol.tokenX || "";
  const tokenYMint = orderContext?.protocol.tokenY || "";

  const poolDataResult = useRealtimePoolData({ tokenXMint, tokenYMint });

  const poolDetails = poolDataResult.data;

  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction: false,
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  const handleFormSubmitRef = useRef<
    ((args: { value: LiquidityFormValues }) => void) | null
  >(null);

  const form = useLiquidityFormState({
    onSubmit: ({ value }) => {
      handleFormSubmitRef.current?.({ value });
    },
    tokenAccountsData,
    walletPublicKey: publicKey || null,
  });

  const transaction = useLiquidityTransaction({
    orderContext,
    poolDetails: poolDetails ?? null,
    resetForm: () => form.reset(),
    tokenAAddress,
    tokenBAddress,
  });

  handleFormSubmitRef.current = transaction.handleFormSubmit;

  return {
    form,
    isCalculating: transaction.isCalculating,
    isError: transaction.isError,
    isPoolLoading: poolDataResult.isLoading,
    isSubmitting: transaction.isSubmitting,
    isSuccess: transaction.isSuccess,
    poolDetails,
    publicKey,
    send: transaction.send,
    tokenAccountsData,
  };
}
