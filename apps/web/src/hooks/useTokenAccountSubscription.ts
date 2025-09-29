"use client";

import { useCallback } from "react";
import { useSolanaSubscription } from "./useSolanaSubscription";

interface TokenAccountData {
  amount: string;
  decimals: number;
  lastUpdate: number;
}

interface UseTokenAccountSubscriptionParams {
  tokenAccountAddress: string | null;
  publicKey: string | null;
  tokenMint: string | null;
  enabled?: boolean;
}

export function useTokenAccountSubscription({
  tokenAccountAddress,
  publicKey,
  tokenMint,
  enabled = true,
}: UseTokenAccountSubscriptionParams) {
  const parseTokenAccountData = useCallback(
    (data: Buffer): Partial<TokenAccountData> => {
      try {
        if (data.length < 165) return {};

        const dataView = new DataView(data.buffer);

        const amount = dataView.getBigUint64(64, true).toString();

        return {
          amount,
          lastUpdate: Date.now(),
        };
      } catch (error) {
        console.error("Failed to parse token account data:", error);
        return {};
      }
    },
    [],
  );

  return useSolanaSubscription({
    accountAddress: tokenAccountAddress,
    queryKey: ["token-accounts", publicKey, tokenMint].filter(
      (item): item is string => item !== null,
    ),
    parseAccountData: parseTokenAccountData,
    enabled: enabled && !!tokenAccountAddress && !!publicKey,
  });
}
