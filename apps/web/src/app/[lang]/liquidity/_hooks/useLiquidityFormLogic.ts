"use client";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
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

  // 2. Token accounts query: owns token balance data
  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction: false,
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  // 3. Machine hook: owns workflow state (pass poolDetails from Query)
  // Note: We'll get token decimals from tokenAccountsData below
  const sendRef = useRef<
    ((event: { type: string; data?: unknown }) => void) | null
  >(null);
  const formRef = useRef<{ reset: () => void } | null>(null);
  const transaction = useLiquidityTransaction({
    form: formRef.current,
    poolDetails,
    tokenAAddress,
    tokenBAddress,
  });
  sendRef.current = transaction.send;

  // 4. Form hook: owns field state
  const { form } = useLiquidityFormState({
    onSubmit: ({ value }) => {
      console.log("Form onSubmit called with value:", value);
      console.log("Sending event with slippage:", slippage);
      if (transaction.isError) {
        sendRef.current?.({ type: "RETRY" });
      } else {
        sendRef.current?.({ data: { ...value, slippage }, type: "SUBMIT" });
      }
    },
    tokenAccountsData,
    walletPublicKey: publicKey || null,
  });
  formRef.current = form;

  // 5. Calculations hook: derives values from pool data
  const { debouncedCalculateTokenAmounts } = useLiquidityAmountDebouncer(
    poolDataResult.data || null,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

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
