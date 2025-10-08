"use client";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { LIQUIDITY_CONSTANTS } from "../_constants/liquidityConstants";
import { useLiquidityAmountDebouncer } from "./useLiquidityCalculations";
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
  const [slippage, setSlippage] = useState<string>(
    LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
  );

  const sortedTokenAddresses = sortSolanaAddresses(
    tokenAAddress || "",
    tokenBAddress || "",
  );
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const poolDataResult = useRealtimePoolData({ tokenXMint, tokenYMint });

  // Initialize transaction machine (follows reactive event pattern)
  const transaction = useLiquidityTransaction({
    tokenAAddress,
    tokenBAddress,
  });

  // Stabilize pool data reference to prevent infinite re-renders
  const stablePoolData = useMemo(
    () => poolDataResult.data,
    [poolDataResult.data],
  );

  // Transform pool data to the format expected by the machine
  const transformedPoolDetails = useMemo(() => {
    return stablePoolData
      ? {
          fee: undefined,
          poolAddress: stablePoolData.lpMint,
          price: undefined,
          tokenXMint: stablePoolData.tokenXMint,
          tokenXReserve: stablePoolData.reserveX,
          tokenYMint: stablePoolData.tokenYMint,
          tokenYReserve: stablePoolData.reserveY,
          totalSupply: stablePoolData.totalLpSupply,
        }
      : null;
  }, [stablePoolData]);

  // Reactive event pattern: send pool data updates to machine
  useEffect(() => {
    console.log("🔍 Pool data update:", {
      exists: stablePoolData?.exists,
      stablePoolData,
      tokenXMint,
      tokenYMint,
      transformedPoolDetails,
    });
    if (transformedPoolDetails) {
      console.log("📤 Sending POOL_DATA_UPDATED to machine:", {
        data: transformedPoolDetails,
      });
      transaction.send({
        data: transformedPoolDetails,
        type: "POOL_DATA_UPDATED",
      });
    }
  }, [
    transformedPoolDetails,
    transaction.send,
    tokenXMint,
    tokenYMint,
    stablePoolData,
  ]);

  const hasRecentTransaction = transaction.isSuccess;
  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction,
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  // Create the TanStack Form in isolation; connect submit to transaction
  const { form } = useLiquidityFormState({
    onSubmit: ({ value }) => {
      transaction.send({ data: value, type: "SUBMIT" });
    },
    tokenAccountsData,
    walletPublicKey: publicKey || null,
  });

  // Debounced derived calculations based on pool reserves
  const { debouncedCalculateTokenAmounts } = useLiquidityAmountDebouncer(
    poolDataResult.data || null,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  // Reset form after a successful transaction (once per success)
  const prevSuccessRef = useRef<boolean>(false);
  useEffect(() => {
    if (transaction.isSuccess && !prevSuccessRef.current) {
      form.reset();
      prevSuccessRef.current = true;
    }
    if (!transaction.isSuccess && prevSuccessRef.current) {
      prevSuccessRef.current = false;
    }
  }, [transaction.isSuccess, form]);

  const poolDetails = poolDataResult.data
    ? {
        fee: undefined,
        poolAddress: poolDataResult.data.lpMint,
        price: undefined,
        tokenXMint: poolDataResult.data.tokenXMint,
        tokenXReserve: poolDataResult.data.reserveX,
        tokenYMint: poolDataResult.data.tokenYMint,
        tokenYReserve: poolDataResult.data.reserveY,
        totalSupply: poolDataResult.data.totalLpSupply,
      }
    : null;

  return {
    debouncedCalculateTokenAmounts,
    form,
    hasError: transaction.isError,
    isCalculating: transaction.isCalculating,
    isError: transaction.isError,
    isPoolLoading: poolDataResult.isLoading,
    isSubmitting: transaction.isSubmitting,
    isSuccess: transaction.isSuccess,
    poolDetails,
    publicKey,
    setSlippage,
    slippage,
    tokenAccountsData,
  };
}
