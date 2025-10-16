"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncate } from "libs/utils/src/common/truncate";
import { useRef } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import {
  type UseRealtimeTokenAccountsReturn,
  useRealtimeTokenAccounts,
} from "../../../../hooks/useRealtimeTokenAccounts";
import { useRecentTransactionTracker } from "../../../../hooks/useRecentTransactionTracker";
import type { LiquidityFormValues } from "../_types/liquidity.types";
import { useLiquidityFormState } from "./useLiquidityFormState";
import { useLiquidityTransaction } from "./useLiquidityTransaction";
import { useTokenOrder } from "./useTokenOrder";

interface UseLiquidityFormLogicProps {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}

export interface UseLiquidityFormLogicReturn {
  form: ReturnType<typeof useLiquidityFormState>;
  isCalculating: boolean;
  isError: boolean;
  isPoolLoading: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  poolDetails: ReturnType<typeof useRealtimePoolData>["data"];
  publicKey: ReturnType<typeof useWallet>["publicKey"];
  send: ReturnType<typeof useLiquidityTransaction>["send"];
  tokenAccountsData: UseRealtimeTokenAccountsReturn;
  tokenASymbol: string;
  tokenBSymbol: string;
}

export function useLiquidityFormLogic({
  tokenAAddress,
  tokenBAddress,
}: UseLiquidityFormLogicProps): UseLiquidityFormLogicReturn {
  const { publicKey } = useWallet();

  const orderContext = useTokenOrder();

  const tokenXMint = orderContext?.protocol.tokenX || "";
  const tokenYMint = orderContext?.protocol.tokenY || "";

  const { hasRecentTransaction, markTransactionComplete } =
    useRecentTransactionTracker();

  const poolDataResult = useRealtimePoolData({
    hasRecentTransaction,
    tokenXMint,
    tokenYMint,
  });

  const poolDetails = poolDataResult.data;

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

  const tokenASymbol =
    tokenAccountsData.tokenAAccount?.tokenAccounts?.[0]?.symbol ||
    truncate(tokenAAddress || "");
  const tokenBSymbol =
    tokenAccountsData.tokenBAccount?.tokenAccounts?.[0]?.symbol ||
    truncate(tokenBAddress || "");

  const transaction = useLiquidityTransaction({
    onTransactionComplete: () => {
      markTransactionComplete();
    },
    orderContext,
    poolDetails: poolDetails ?? null,
    resetForm: () => form.reset(),
    tokenAAddress,
    tokenASymbol,
    tokenBAddress,
    tokenBSymbol,
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
    tokenASymbol,
    tokenBSymbol,
  };
}
