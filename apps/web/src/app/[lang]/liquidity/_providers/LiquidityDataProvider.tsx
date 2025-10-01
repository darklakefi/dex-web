"use client";

import { sortSolanaAddresses } from "@dex-web/utils";
import { createContext, type ReactNode, useContext } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { useWalletPublicKey } from "../../../../hooks/useWalletCache";
import type {
  PoolDetails,
  UseRealtimeTokenAccountsReturn,
} from "../_types/liquidity.types";

interface PoolDataContextValue {
  poolDetails: PoolDetails | null;
  tokenAccountsData: UseRealtimeTokenAccountsReturn;
  tokenXMint: string;
  tokenYMint: string;
  isLoading: boolean;
  error: Error | null;
}

const PoolDataContext = createContext<PoolDataContextValue | null>(null);

interface PoolDataProviderProps {
  children: ReactNode;
  tokenAAddress: string;
  tokenBAddress: string;
  hasRecentTransaction?: boolean;
}

export function PoolDataProvider({
  children,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction = false,
}: PoolDataProviderProps) {
  const { data: walletPublicKey } = useWalletPublicKey();

  const sortedTokenAddresses = sortSolanaAddresses(
    tokenAAddress,
    tokenBAddress,
  );
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const poolDataResult = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  const tokenAccountsData = useRealtimeTokenAccounts({
    hasRecentTransaction,
    publicKey: walletPublicKey || null,
    tokenAAddress,
    tokenBAddress,
  });

  const value: PoolDataContextValue = {
    error: poolDataResult.error || null,
    isLoading:
      poolDataResult.isLoading ||
      tokenAccountsData.isLoadingBuy ||
      tokenAccountsData.isLoadingSell,
    poolDetails: poolDataResult.data as any,
    tokenAccountsData,
    tokenXMint,
    tokenYMint,
  };

  return (
    <PoolDataContext.Provider value={value}>
      {children}
    </PoolDataContext.Provider>
  );
}

export function usePoolData() {
  const context = useContext(PoolDataContext);
  if (!context) {
    throw new Error("usePoolData must be used within a PoolDataProvider");
  }
  return context;
}
