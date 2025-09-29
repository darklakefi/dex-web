"use client";

import { useCallback } from "react";
import { useSolanaSubscription } from "./useSolanaSubscription";

interface PoolData {
  tokenXReserve: string;
  tokenYReserve: string;
  lpSupply: string;
  lastUpdate: number;
}

interface UsePoolSubscriptionParams {
  poolAddress: string | null;
  tokenXMint: string;
  tokenYMint: string;
  enabled?: boolean;
}

export function usePoolSubscription({
  poolAddress,
  tokenXMint,
  tokenYMint,
  enabled = true,
}: UsePoolSubscriptionParams) {
  const parsePoolAccountData = useCallback((data: Buffer): Partial<PoolData> => {
    try {
      if (data.length < 64) return {};

      const dataView = new DataView(data.buffer);

      const tokenXReserve = dataView.getBigUint64(8, true).toString();
      const tokenYReserve = dataView.getBigUint64(16, true).toString();
      const lpSupply = dataView.getBigUint64(24, true).toString();

      return {
        tokenXReserve,
        tokenYReserve,
        lpSupply,
        lastUpdate: Date.now(),
      };
    } catch (error) {
      console.error("Failed to parse pool account data:", error);
      return {};
    }
  }, []);

  return useSolanaSubscription({
    accountAddress: poolAddress,
    queryKey: ["pool", tokenXMint, tokenYMint],
    parseAccountData: parsePoolAccountData,
    enabled: enabled && !!poolAddress,
  });
}