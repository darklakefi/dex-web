import { QUERY_CONFIG, tanstackClient } from "@dex-web/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface UseTokenSearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  onlyWithPools?: boolean;
}

/**
 * Optimized hook for token searching with proper caching and UX
 * Uses placeholderData to keep previous results visible while loading new ones
 */
export function useTokenSearch({
  query,
  limit = 8,
  offset = 0,
  onlyWithPools = false,
}: UseTokenSearchOptions) {
  const queryInput = useMemo(
    () => ({
      limit,
      offset,
      onlyWithPools,
      query,
    }),
    [query, limit, offset, onlyWithPools],
  );

  const isSearchQuery = query.length > 0;

  const result = useSuspenseQuery({
    ...tanstackClient.tokens.getTokensWithPools.queryOptions({
      input: queryInput,
    }),
    gcTime: isSearchQuery
      ? QUERY_CONFIG.tokenSearch.gcTime
      : QUERY_CONFIG.tokens.gcTime,
    // Keep previous data while fetching new results for smooth UX
    placeholderData: (previousData) => previousData,
    staleTime: isSearchQuery
      ? QUERY_CONFIG.tokenSearch.staleTime
      : QUERY_CONFIG.tokens.staleTime,
  });

  return {
    ...result,
    isSearching: isSearchQuery,
  };
}
