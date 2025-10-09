import { QUERY_CONFIG, tanstackClient, tokenQueryKeys } from "@dex-web/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ADDRESS_QUERY_THRESHOLD,
  createTokenSearchIndex,
  searchTokens,
} from "../../_utils/tokenSearch";
import {
  TOKEN_SEARCH_DISPLAY_SIZE,
  TOKEN_SEARCH_FETCH_SIZE,
} from "./constants";

export interface TokenSearchResult {
  hasMore: boolean;
  tokens: Array<{
    address: string;
    decimals: number;
    imageUrl: string;
    name: string;
    symbol: string;
  }>;
  total: number;
}

/**
 * Custom hook to handle token search with data fetching and transformation.
 * Fetches up to 10,000 tokens from the backend to enable comprehensive search,
 * applies MiniSearch for intelligent full-text search with fuzzy matching and
 * field boosting, then displays only the top 8 most relevant tokens in the UI.
 *
 * Performance optimizations:
 * - MiniSearch index is created once and memoized (not recreated on every search)
 * - Query is debounced at call site (via debouncedQuery parameter)
 * - Only necessary fields are stored in search index
 * - Results are cached via React Query with dedicated search cache (5min staleTime)
 *
 * Search features (powered by MiniSearch):
 * - Field boosting: Symbol (3x) > Name (2x) > Address (1x)
 * - Fuzzy matching for typo tolerance (edit distance 0.2)
 * - Prefix matching for "as you type" experience
 * - Case-insensitive search
 * - Automatic relevance ranking
 *
 * @param {string} debouncedQuery - The debounced search query
 * @returns Query result with MiniSearch-sorted token data (most relevant first)
 */
export function useTokenSearch(debouncedQuery: string): {
  data: TokenSearchResult;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  status: "pending" | "error" | "success";
  refetch: () => void;
} {
  const queryInput = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim();

    return {
      $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
      pageNumber: 1,
      pageSize: TOKEN_SEARCH_FETCH_SIZE,
      ...(trimmedQuery.length > 0 && {
        filterBy:
          trimmedQuery.length > ADDRESS_QUERY_THRESHOLD
            ? {
                case: "addressesList" as const,
                value: {
                  $typeName: "darklake.v1.TokenAddressesList" as const,
                  tokenAddresses: [trimmedQuery],
                },
              }
            : {
                case: "substring" as const,
                value: trimmedQuery,
              },
      }),
    };
  }, [debouncedQuery]);

  const queryResult = useSuspenseQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
      input: queryInput,
    }),
    gcTime: debouncedQuery
      ? QUERY_CONFIG.tokenSearch.gcTime
      : QUERY_CONFIG.tokenMetadata.gcTime,
    queryKey: tokenQueryKeys.search.query(
      debouncedQuery,
      TOKEN_SEARCH_FETCH_SIZE,
    ),
    retry: QUERY_CONFIG.tokenSearch.retry,
    staleTime: debouncedQuery
      ? QUERY_CONFIG.tokenSearch.staleTime
      : QUERY_CONFIG.tokenMetadata.staleTime,
  });

  const allTokens = useMemo(
    () =>
      queryResult.data.tokens.map((token) => ({
        address: token.address,
        decimals: token.decimals,
        imageUrl: token.logoUri,
        name: token.name,
        symbol: token.symbol,
      })),
    [queryResult.data.tokens],
  );

  const miniSearch = useMemo(
    () => createTokenSearchIndex(allTokens),
    [allTokens],
  );

  const searchResults = useMemo(
    () => searchTokens(miniSearch, allTokens, debouncedQuery),
    [miniSearch, allTokens, debouncedQuery],
  );

  const data: TokenSearchResult = useMemo(
    () => ({
      hasMore:
        queryResult.data.currentPage < queryResult.data.totalPages ||
        searchResults.length > TOKEN_SEARCH_DISPLAY_SIZE,
      tokens: searchResults.slice(0, TOKEN_SEARCH_DISPLAY_SIZE),
      total: searchResults.length,
    }),
    [queryResult.data.currentPage, queryResult.data.totalPages, searchResults],
  );

  return {
    data,
    error: queryResult.error,
    isError: queryResult.isError,
    isLoading: queryResult.isLoading,
    isPending: queryResult.isPending,
    isSuccess: queryResult.isSuccess,
    refetch: queryResult.refetch,
    status: queryResult.status,
  };
}
