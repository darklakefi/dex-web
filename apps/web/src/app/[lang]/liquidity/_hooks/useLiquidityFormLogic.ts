"use client";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo, useRef, useState } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { LIQUIDITY_CONSTANTS } from "../_constants/liquidityConstants";
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

  const poolDetails = useMemo(() => {
    const data = poolDataResult.data;
    return data
      ? {
          fee: undefined,
          poolAddress: data.lpMint,
          price: undefined,
          protocolFeeX: data.protocolFeeX,
          protocolFeeY: data.protocolFeeY,
          tokenXMint: data.tokenXMint,
          tokenXReserve: data.reserveX,
          tokenXReserveRaw: data.reserveXRaw,
          tokenYMint: data.tokenYMint,
          tokenYReserve: data.reserveY,
          tokenYReserveRaw: data.reserveYRaw,
          // Add new fields for transformer
          totalReserveXRaw: data.totalReserveXRaw,
          totalReserveYRaw: data.totalReserveYRaw,
          totalSupply: data.totalLpSupply,
          totalSupplyRaw: data.totalLpSupplyRaw,
          userLockedX: data.userLockedX,
          userLockedY: data.userLockedY,
        }
      : null;
  }, [poolDataResult.data]);

  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction: false,
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  const sendRef = useRef<
    ((event: { type: string; data?: unknown }) => void) | null
  >(null);
  const formRef = useRef<{ reset: () => void } | undefined>(undefined);
  const transaction = useLiquidityTransaction({
    form: formRef.current,
    poolDetails,
    tokenAAddress,
    tokenBAddress,
  });
  sendRef.current = transaction.send as (event: {
    type: string;
    data?: unknown;
  }) => void;

  const { form } = useLiquidityFormState({
    onSubmit: ({ value }) => {
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

  return {
    form,
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
