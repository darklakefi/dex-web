"use client";

import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { connectionPool } from "./useConnectionPool";

interface UseSolanaSubscriptionParams {
  accountAddress: string | null;
  queryKey: string[];
  parseAccountData: (data: Buffer) => unknown;
  enabled?: boolean;
  commitment?: "processed" | "confirmed" | "finalized";
}

export function useSolanaSubscription({
  accountAddress,
  queryKey,
  parseAccountData,
  enabled = true,
  commitment = "confirmed",
}: UseSolanaSubscriptionParams) {
  const queryClient = useQueryClient();
  const subscriptionId = useRef<number | null>(null);
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "";

  useEffect(() => {
    if (!enabled || !accountAddress) return;

    const setupSubscription = async () => {
      try {
        const connection = connectionPool.getConnection(endpoint);
        const publicKey = new PublicKey(accountAddress);

        subscriptionId.current = connection.onAccountChange(
          publicKey,
          (accountInfo) => {
            try {
              const parsedData = parseAccountData(accountInfo.data);
              queryClient.setQueryData(queryKey, parsedData);
              queryClient.invalidateQueries({ queryKey });
            } catch (error) {
              console.error("Failed to parse account data:", error);
            }
          },
          commitment,
        );

        if (subscriptionId.current) {
          connectionPool.addSubscription(endpoint, subscriptionId.current);
        }
      } catch (error) {
        console.error("Failed to setup WebSocket subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      if (subscriptionId.current) {
        const connection = connectionPool.getConnection(endpoint);
        connection.removeAccountChangeListener(subscriptionId.current);
        connectionPool.removeSubscription(endpoint, subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [
    accountAddress,
    enabled,
    commitment,
    queryKey,
    queryClient,
    parseAccountData,
    endpoint,
  ]);

  return { isSubscribed: subscriptionId.current !== null };
}
