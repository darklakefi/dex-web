"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { useWalletPublicKey } from "../../../../hooks/useWalletCache";
import { sortSolanaAddresses } from "@dex-web/utils";
import type { PoolDetails, UseRealtimeTokenAccountsReturn } from "../_types/liquidity.types";

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
  const { data: publicKey } = useWalletPublicKey();
  
  const sortedTokenAddresses = sortSolanaAddresses(tokenAAddress, tokenBAddress);
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const poolDataResult = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  const tokenAccountsData = useRealtimeTokenAccounts({
    publicKey: publicKey || null,
    tokenAAddress,
    tokenBAddress,
    hasRecentTransaction,
  });

  const value: PoolDataContextValue = {
    poolDetails: poolDataResult.data as any,
    tokenAccountsData,
    tokenXMint,
    tokenYMint,
    isLoading: poolDataResult.isLoading || tokenAccountsData.isLoadingBuy || tokenAccountsData.isLoadingSell,
    error: poolDataResult.error || null,
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