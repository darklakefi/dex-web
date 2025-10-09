/**
 * Token Prices Hook
 *
 * Provides non-suspense token price queries to prevent request waterfalls.
 * This hook is designed to be used at form-level to fetch prices for both tokens upfront,
 * avoiding the FormFieldset suspense waterfall issue.
 *
 * Key Features:
 * - Uses regular useQuery (non-suspense) to avoid blocking renders
 * - Batches multiple token price queries using useSuspenseQueries when needed
 * - Provides loading states for graceful degradation
 * - Shares cache with other price queries via queryKeys
 *
 * Usage:
 * ```tsx
 * // At form level
 * const prices = useTokenPrices([tokenAAddress, tokenBAddress]);
 *
 * // Pass to FormFieldset
 * <FormFieldset tokenPrice={prices[tokenAAddress]} ... />
 * ```
 *
 * @module useTokenPrices
 */

"use client";

import { tanstackClient } from "@dex-web/orpc";
import type { GetTokenPriceOutput } from "@dex-web/orpc/schemas/index";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQueries,
  useQuery,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../lib/queryKeys";

/**
 * Hook to fetch a single token price without suspense.
 * Prevents blocking renders while price loads.
 */
export function useTokenPrice(
  address: string | null,
  options?: { enabled?: boolean },
): UseQueryResult<GetTokenPriceOutput> {
  return useQuery({
    ...tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: address || "",
        quoteCurrency: "USD",
      },
    }),
    enabled: !!address && (options?.enabled ?? true),
    gcTime: 30 * 1000,
    queryKey: queryKeys.tokens.price(address || ""),
    staleTime: 5 * 1000,
  });
}

/**
 * Hook to fetch multiple token prices in parallel using suspense.
 * Use this at the form level to prefetch all needed prices at once,
 * avoiding nested suspense waterfalls.
 *
 * @param addresses - Array of token addresses to fetch prices for
 * @returns Array of query results in the same order as addresses
 */
export function useTokenPricesBatch(
  addresses: (string | null)[],
): UseSuspenseQueryResult<GetTokenPriceOutput>[] {
  const validAddresses = addresses.filter((addr): addr is string => !!addr);

  return useSuspenseQueries({
    queries: validAddresses.map((address) => ({
      ...tanstackClient.tokens.getTokenPrice.queryOptions({
        input: {
          amount: 1,
          mint: address,
          quoteCurrency: "USD",
        },
      }),
      queryKey: queryKeys.tokens.price(address),
      staleTime: 5 * 1000,
    })),
  });
}

/**
 * Hook to fetch multiple token prices as a map for easy lookup.
 * Non-suspense version that provides loading states.
 *
 * @param addresses - Array of token addresses
 * @returns Object with prices map and combined loading state
 */
export function useTokenPricesMap(addresses: (string | null)[]): {
  prices: Record<string, GetTokenPriceOutput | undefined>;
  isLoading: boolean;
  isError: boolean;
  errors: Error[];
} {
  const validAddresses = addresses.filter((addr): addr is string => !!addr);

  const queries = useQueries({
    queries: validAddresses.map((address) => ({
      ...tanstackClient.tokens.getTokenPrice.queryOptions({
        input: {
          amount: 1,
          mint: address,
          quoteCurrency: "USD",
        },
      }),
      enabled: !!address,
      gcTime: 30 * 1000,
      queryKey: queryKeys.tokens.price(address),
      staleTime: 5 * 1000,
    })),
  });

  const prices = useMemo(() => {
    const priceMap: Record<string, GetTokenPriceOutput | undefined> = {};
    validAddresses.forEach((address, index) => {
      priceMap[address] = queries[index]?.data;
    });
    return priceMap;
  }, [queries, validAddresses]);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const errors = queries
    .map((q) => q.error)
    .filter((err): err is Error => err !== null);

  return {
    errors,
    isError,
    isLoading,
    prices,
  };
}
