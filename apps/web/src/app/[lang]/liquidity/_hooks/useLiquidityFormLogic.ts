"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRef } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { useRecentTransactionTracker } from "../../../../hooks/useRecentTransactionTracker";
import type { LiquidityFormValues } from "../_types/liquidity.types";
import { useLiquidityFormState } from "./useLiquidityFormState";
import { useLiquidityTransaction } from "./useLiquidityTransaction";
import { useTokenOrder } from "./useTokenOrder";

interface UseLiquidityFormLogicProps {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}

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

  const { hasRecentTransaction, markTransactionComplete } =
    useRecentTransactionTracker();

  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction,
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
  });

  const transaction = useLiquidityTransaction({
    onTransactionComplete: () => {
      markTransactionComplete();
    },
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
