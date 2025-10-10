import { QUERY_CONFIG, type Token, tanstackClient } from "@dex-web/orpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ADDRESS_QUERY_THRESHOLD,
  createTokenSearchIndex,
  searchTokens,
} from "../../_utils/tokenSearch";
import { TOKEN_SEARCH_FETCH_SIZE } from "./constants";

type SearchableToken = Token & {
  name: string;
  symbol: string;
};

/**
 * Custom hook for infinite scrolling token search with virtual scrolling support.
 * Follows the standard TanStack Query infinite pattern like the working examples.
 *
 * @param debouncedQuery - The debounced search query
 * @returns Infinite query result with client-side search applied
 */
export function useTokenInfiniteSearch(debouncedQuery: string): {
  allTokens: SearchableToken[];
  data: SearchableToken[] | undefined;
  tokens: SearchableToken[];
  error: Error | null;
  isError: boolean;
  isPending: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  status: "pending" | "error" | "success";
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isFetching: boolean;
} {
  const trimmedQuery = debouncedQuery.trim();
  const hasQuery = trimmedQuery.length > 0;

  const filterBy = useMemo(() => {
    return trimmedQuery.length > ADDRESS_QUERY_THRESHOLD
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
        };
  }, [trimmedQuery]);

  const queryResult = useInfiniteQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.infiniteOptions({
      getNextPageParam: (lastPage) => {
        if (lastPage.currentPage < lastPage.totalPages) {
          return lastPage.currentPage + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      input: (pageParam: number) => ({
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        filterBy: filterBy,
        pageNumber: pageParam,
        pageSize: TOKEN_SEARCH_FETCH_SIZE,
      }),
    }),
    enabled: hasQuery,
    gcTime: QUERY_CONFIG.tokenSearch.gcTime,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: QUERY_CONFIG.tokenSearch.retry,
    staleTime: QUERY_CONFIG.tokenSearch.staleTime,
  });

  const allTokens = useMemo(() => {
    if (!queryResult.data?.pages) return [];

    return queryResult.data.pages
      .flatMap((page) => page.tokens ?? [])
      .filter((token) => token.name && token.symbol)
      .map(
        (token): SearchableToken => ({
          address: token.address,
          decimals: token.decimals,
          imageUrl: token.logoUri ?? "",
          name: token.name!,
          symbol: token.symbol!,
        }),
      );
  }, [queryResult.data?.pages]);

  const miniSearch = useMemo(
    () => createTokenSearchIndex(allTokens),
    [allTokens],
  );

  const searchResults = useMemo(
    () => searchTokens(miniSearch, allTokens, trimmedQuery),
    [miniSearch, allTokens, trimmedQuery],
  );

  return {
    ...queryResult,
    allTokens,
    data: allTokens.length > 0 ? allTokens : undefined,
    tokens: hasQuery && searchResults.length > 0 ? searchResults : allTokens,
  };
}
