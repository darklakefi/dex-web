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

/**
 * Conductor pattern: orchestrates multiple hooks as siblings and wires them together explicitly.
 * - Query hooks own server state
 * - Form hook owns field state
 * - Machine hook owns workflow state
 * This hook mediates between them without creating nested dependencies.
 */
export function useLiquidityFormLogic({
  tokenAAddress,
  tokenBAddress,
}: UseLiquidityFormLogicProps) {
  const { publicKey } = useWallet();
  const [slippage, setSlippage] = useState<string>(
    LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
  );

  // Get sorted addresses for pool lookup
  const sortedTokenAddresses = sortSolanaAddresses(
    tokenAAddress || "",
    tokenBAddress || "",
  );
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  // === Call hooks as siblings (conductor pattern) ===

  // 1. Query hook: owns pool data
  const poolDataResult = useRealtimePoolData({ tokenXMint, tokenYMint });

  // Stabilize and transform pool data
  const poolDetails = useMemo(() => {
    const data = poolDataResult.data;
    return data
      ? {
          fee: undefined,
          poolAddress: data.lpMint,
          price: undefined,
          tokenXMint: data.tokenXMint,
          tokenXReserve: data.reserveX,
          tokenYMint: data.tokenYMint,
          tokenYReserve: data.reserveY,
          totalSupply: data.totalLpSupply,
        }
      : null;
  }, [poolDataResult.data]);

  // 2. Machine hook: owns workflow state (pass poolDetails from Query)
  const transaction = useLiquidityTransaction({
    poolDetails,
    tokenAAddress,
    tokenBAddress,
  });

  // 3. Token accounts query: owns token balance data
  const hasRecentTransaction = transaction.isSuccess;
  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction,
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  // 4. Form hook: owns field state
  const { form } = useLiquidityFormState({
    onSubmit: ({ value }) => {
      transaction.send({ data: value, type: "SUBMIT" });
    },
    tokenAccountsData,
    walletPublicKey: publicKey || null,
  });

  // 5. Calculations hook: derives values from pool data
  const { debouncedCalculateTokenAmounts } = useLiquidityAmountDebouncer(
    poolDataResult.data || null,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  // === Wire hooks together explicitly with effects ===

  // Effect: Reset machine if it's stuck in success/error state on mount
  const hasResetOnMount = useRef(false);
  useEffect(() => {
    if (
      !hasResetOnMount.current &&
      (transaction.isSuccess || transaction.isError)
    ) {
      transaction.send({ type: "RESET" });
      hasResetOnMount.current = true;
    }
  }, [transaction.isSuccess, transaction.isError, transaction.send]);

  // Effect: Reset form after successful transaction
  const prevSuccessRef = useRef<boolean>(false);
  useEffect(() => {
    if (transaction.isSuccess && !prevSuccessRef.current) {
      form.reset();
      prevSuccessRef.current = true;
      // Reset machine after a delay to allow UI to show success
      setTimeout(() => {
        transaction.send({ type: "RESET" });
      }, 1000);
    }
    if (!transaction.isSuccess && prevSuccessRef.current) {
      prevSuccessRef.current = false;
    }
  }, [transaction.isSuccess, form, transaction.send]);

  // === Return coordinated interface ===
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
