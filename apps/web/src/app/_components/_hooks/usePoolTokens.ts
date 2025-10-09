import { QUERY_CONFIG, tanstackClient, tokenQueryKeys } from "@dex-web/orpc";
import type { Token } from "@dex-web/orpc/schemas/index";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Custom hook to fetch unique tokens that exist in pools.
 *
 * This hook:
 * 1. Fetches all pools using getAllPools (suspense)
 * 2. Extracts unique token mint addresses from pools
 * 3. Fetches metadata for those tokens via getTokenMetadataList (suspense, dependent query)
 * 4. Returns tokens with metadata when available, fallback data otherwise
 *
 * Uses dedicated cache strategy:
 * - Pool list: 2min staleTime (pools change when liquidity added)
 * - Token metadata: 10min staleTime (metadata is stable)
 *
 * Implementation pattern (per React Query Suspense docs):
 * - Both queries use useSuspenseQuery for consistent suspense behavior
 * - Dependent queries fetch serially with suspense (expected/intended behavior)
 * - Cannot use `enabled` option with useSuspenseQuery
 * - Suspense boundary handles loading states
 *
 * @returns Query result with unique tokens from pools
 */
export function usePoolTokens() {
  const poolsQuery = useSuspenseQuery({
    ...tanstackClient.pools.getAllPools.queryOptions({
      input: {
        includeEmpty: true,
      },
    }),
    gcTime: 10 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const uniqueTokenAddresses = useMemo(() => {
    const addressSet = new Set<string>();

    for (const pool of poolsQuery.data.pools) {
      addressSet.add(pool.tokenXMint);
      addressSet.add(pool.tokenYMint);
    }

    return Array.from(addressSet);
  }, [poolsQuery.data.pools]);

  const tokensQuery = useSuspenseQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
      input: {
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        pageNumber: 1,
        pageSize: 10000,
        ...(uniqueTokenAddresses.length > 0 && {
          filterBy: {
            case: "addressesList" as const,
            value: {
              $typeName: "darklake.v1.TokenAddressesList" as const,
              tokenAddresses: uniqueTokenAddresses,
            },
          },
        }),
      },
    }),
    gcTime: QUERY_CONFIG.poolTokensMetadata.gcTime,
    queryKey: tokenQueryKeys.metadata.poolTokens(),
    retry: QUERY_CONFIG.poolTokensMetadata.retry,
    staleTime: QUERY_CONFIG.poolTokensMetadata.staleTime,
  });

  const tokens: Token[] = useMemo(() => {
    const tokenMetadataMap = new Map(
      tokensQuery.data.tokens.map((token) => [token.address, token]),
    );

    const result = uniqueTokenAddresses.map((address) => {
      const metadata = tokenMetadataMap.get(address);

      if (metadata) {
        return {
          address: metadata.address,
          decimals: metadata.decimals,
          imageUrl: metadata.logoUri || "",
          name: metadata.name,
          symbol: metadata.symbol,
        };
      }
      return {
        address,
        decimals: 9,
        imageUrl: "",
        name: `${address.slice(0, 4)}...${address.slice(-4)}`,
        symbol: address.slice(0, 4).toUpperCase(),
      };
    });

    return result;
  }, [tokensQuery.data.tokens, uniqueTokenAddresses]);

  return {
    data: tokens,
    refetch: () => {
      poolsQuery.refetch();
      tokensQuery.refetch();
    },
  };
}
