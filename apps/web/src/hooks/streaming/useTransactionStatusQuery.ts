"use client";

import { tanstackClient } from "@dex-web/orpc";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import type { TransactionStreamData } from "./types";

/**
 * Hook for fetching transaction status data via oRPC.
 * This handles the server state for transaction status using TanStack Query.
 */

interface UseTransactionStatusQueryParams {
  trackingId: string | null;
  tradeId?: string;
  options?: Partial<UseQueryOptions<TransactionStreamData>>;
}

export function useTransactionStatusQuery({
  trackingId,
  tradeId,
  options = {},
}: UseTransactionStatusQueryParams) {
  return useQuery({
    ...tanstackClient.dexGateway.getTransactionStatus.queryOptions({
      input: { trackingId: trackingId || "", tradeId },
    }),
    enabled: !!trackingId,
    ...options,
  });
}
