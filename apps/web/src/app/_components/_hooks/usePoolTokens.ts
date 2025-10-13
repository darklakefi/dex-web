import { QUERY_CONFIG, tanstackClient } from "@dex-web/orpc";
import type { Token } from "@dex-web/orpc/schemas/index";
import { SOL_TOKEN_ADDRESS, WSOL_TOKEN_ADDRESS } from "@dex-web/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A constant list of popular token addresses.
 * FIX: Defined as a mutable `string[]` to be compatible with both the oRPC client
 * input and the Array.prototype.indexOf method.
 *
 * Updated to include both native SOL and WSOL as separate entries.
 */
export const POPULAR_TOKEN_ADDRESSES: string[] = [
  SOL_TOKEN_ADDRESS,
  WSOL_TOKEN_ADDRESS,
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
];

/**
 * The maximum number of pool tokens to fetch in a single metadata request.
 */
export const MAX_POOL_TOKENS_TO_FETCH = 400;

/**
 * Custom hook to fetch unique tokens that exist in pools with improved reliability.
 * Follows oRPC Tanstack Query integration patterns using queryClient.fetchQuery.
 */
export function usePoolTokens() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    gcTime: QUERY_CONFIG.poolTokensMetadata.gcTime,
    queryFn: async () => {
      const [popularTokensResult, poolsResult] = await Promise.allSettled([
        queryClient.fetchQuery(
          tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
            context: { cache: "force-cache" as RequestCache },
            input: {
              $typeName: "darklake.v1.GetTokenMetadataListRequest",
              filterBy: {
                case: "addressesList",
                value: {
                  $typeName: "darklake.v1.TokenAddressesList",
                  tokenAddresses: POPULAR_TOKEN_ADDRESSES,
                },
              },
              pageNumber: 1,
              pageSize: POPULAR_TOKEN_ADDRESSES.length,
            },
          }),
        ),
        queryClient.fetchQuery(
          tanstackClient.pools.getAllPools.queryOptions({
            context: { cache: "force-cache" as RequestCache },
            input: { includeEmpty: false },
          }),
        ),
      ]);

      const tokenMetadataMap = new Map<string, Token>();

      if (
        popularTokensResult.status === "fulfilled" &&
        popularTokensResult.value.tokens
      ) {
        for (const token of popularTokensResult.value.tokens) {
          if (token.symbol && token.name) {
            tokenMetadataMap.set(token.address, token);
          }
        }
      }

      if (poolsResult.status === "fulfilled" && poolsResult.value.pools) {
        const poolTokenAddresses = new Set<string>();
        for (const pool of poolsResult.value.pools) {
          poolTokenAddresses.add(pool.tokenXMint);
          poolTokenAddresses.add(pool.tokenYMint);
        }
        const uniquePoolTokenAddresses = Array.from(poolTokenAddresses);

        if (uniquePoolTokenAddresses.length > 0) {
          const poolTokensResult = await queryClient.fetchQuery(
            tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
              context: { cache: "force-cache" as RequestCache },
              input: {
                $typeName: "darklake.v1.GetTokenMetadataListRequest",
                filterBy: {
                  case: "addressesList",
                  value: {
                    $typeName: "darklake.v1.TokenAddressesList",
                    tokenAddresses: uniquePoolTokenAddresses,
                  },
                },
                pageNumber: 1,
                pageSize: Math.min(
                  uniquePoolTokenAddresses.length,
                  MAX_POOL_TOKENS_TO_FETCH,
                ),
              },
            }),
          );

          if (poolTokensResult.tokens) {
            for (const token of poolTokensResult.tokens) {
              if (token.symbol && token.name) {
                tokenMetadataMap.set(token.address, token);
              }
            }
          }
        }
      }

      const combinedTokens = Array.from(tokenMetadataMap.values());

      const sortedTokens = combinedTokens.sort((a, b) => {
        const aIsPopular = POPULAR_TOKEN_ADDRESSES.includes(a.address);
        const bIsPopular = POPULAR_TOKEN_ADDRESSES.includes(b.address);

        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        if (aIsPopular && bIsPopular) {
          return (
            POPULAR_TOKEN_ADDRESSES.indexOf(a.address) -
            POPULAR_TOKEN_ADDRESSES.indexOf(b.address)
          );
        }

        return a.symbol.localeCompare(b.symbol);
      });

      return sortedTokens;
    },
    queryKey: ["allPoolTokens"],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: QUERY_CONFIG.poolTokensMetadata.retry,
    staleTime: QUERY_CONFIG.poolTokensMetadata.staleTime,
  });

  return {
    data: queryResult.data ?? [],
    hasData: (queryResult.data?.length ?? 0) > 0,
    isError: queryResult.isError,
    isLoading: queryResult.isLoading,
    refetch: queryResult.refetch,
  };
}
