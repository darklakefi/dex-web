import { tanstackClient } from "@dex-web/orpc";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { TOKEN_SEARCH_FETCH_SIZE } from "./constants";

/**
 * Custom hook to handle token search prefetching for better UX.
 * Prefetches popular tokens on mount and anticipates user searches.
 * Uses a fetch size of 10,000 tokens to enable comprehensive search results.
 *
 * @param {string} rawQuery - The current raw search query (not debounced)
 * @param {boolean} isClosing - Whether the modal is closing (to prevent unnecessary prefetching)
 */
export function useTokenPrefetching(rawQuery: string, isClosing: boolean) {
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (isClosing) return;

    const popularSearches = ["SOL", "USDC", "USDT"];
    popularSearches.forEach((searchTerm) => {
      queryClient.prefetchQuery(
        tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
          input: {
            $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
            filterBy: {
              case: "substring" as const,
              value: searchTerm,
            },
            pageNumber: 1,
            pageSize: TOKEN_SEARCH_FETCH_SIZE,
          },
        }),
      );
    });
  }, [queryClient, isClosing]);

  useEffect(() => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
    }

    if (isClosing) return;

    if (rawQuery.length >= 2 && rawQuery.length < 10) {
      prefetchTimerRef.current = setTimeout(() => {
        queryClient.prefetchQuery(
          tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
            input: {
              $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
              filterBy:
                rawQuery.length > 30
                  ? {
                      case: "addressesList" as const,
                      value: {
                        $typeName: "darklake.v1.TokenAddressesList" as const,
                        tokenAddresses: [rawQuery],
                      },
                    }
                  : {
                      case: "substring" as const,
                      value: rawQuery,
                    },
              pageNumber: 1,
              pageSize: TOKEN_SEARCH_FETCH_SIZE,
            },
          }),
        );
      }, 100);
    }

    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
      }
    };
  }, [rawQuery, queryClient, isClosing]);
}
