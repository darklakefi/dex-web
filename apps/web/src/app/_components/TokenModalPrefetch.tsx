"use client";

import { QUERY_CONFIG, tanstackClient, tokenQueryKeys } from "@dex-web/orpc";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { scheduleIdleTask } from "../_utils/requestIdleCallback";
import { PREFETCH_DELAY_MS, TOKEN_SEARCH_FETCH_SIZE } from "./_hooks/constants";

/**
 * Client component that prefetches SelectTokenModal queries on mount.
 * This runs after the initial page render, ensuring it doesn't delay
 * the critical rendering path or block server-side rendering.
 *
 * The prefetching happens in the background and populates the cache
 * so when users open the token selector modal, the data is already available.
 *
 * Prefetches:
 * 1. All pools (needed by usePoolTokens)
 * 2. All token metadata (needed by useTokenSearch initial state)
 * 3. Pool token metadata (dependent query from usePoolTokens)
 */
export function TokenModalPrefetch() {
  const queryClient = useQueryClient();
  const hasPreFetched = useRef(false);

  useEffect(() => {
    if (hasPreFetched.current) return;
    hasPreFetched.current = true;

    const prefetchTokenModalData = async () => {
      try {
        const poolsPromise = queryClient.prefetchQuery({
          ...tanstackClient.pools.getAllPools.queryOptions({
            input: {
              includeEmpty: true,
            },
          }),
          gcTime: 10 * 60 * 1000,
          staleTime: 2 * 60 * 1000,
        });

        const tokensPromise = queryClient.prefetchQuery({
          ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
            input: {
              $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
              pageNumber: 1,
              pageSize: TOKEN_SEARCH_FETCH_SIZE,
            },
          }),
          gcTime: QUERY_CONFIG.tokenMetadata.gcTime,
          staleTime: QUERY_CONFIG.tokenMetadata.staleTime,
        });

        await Promise.all([poolsPromise, tokensPromise]);

        const poolsData = queryClient.getQueryData(
          tanstackClient.pools.getAllPools.queryOptions({
            input: {
              includeEmpty: true,
            },
          }).queryKey,
        ) as
          | { pools: Array<{ tokenXMint: string; tokenYMint: string }> }
          | undefined;

        if (poolsData?.pools && poolsData.pools.length > 0) {
          const uniqueTokenAddresses = Array.from(
            new Set(
              poolsData.pools.flatMap((pool) => [
                pool.tokenXMint,
                pool.tokenYMint,
              ]),
            ),
          );

          if (uniqueTokenAddresses.length > 0) {
            await queryClient.prefetchQuery({
              ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
                input: {
                  $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
                  filterBy: {
                    case: "addressesList" as const,
                    value: {
                      $typeName: "darklake.v1.TokenAddressesList" as const,
                      tokenAddresses: uniqueTokenAddresses,
                    },
                  },
                  pageNumber: 1,
                  pageSize: TOKEN_SEARCH_FETCH_SIZE,
                },
              }),
              gcTime: QUERY_CONFIG.poolTokensMetadata.gcTime,
              queryKey: tokenQueryKeys.metadata.poolTokens(),
              staleTime: QUERY_CONFIG.poolTokensMetadata.staleTime,
            });
          }
        }
      } catch (error) {
        console.error("Failed to prefetch token modal queries:", error);
      }
    };

    scheduleIdleTask(prefetchTokenModalData, PREFETCH_DELAY_MS);
  }, [queryClient]);

  return null;
}
