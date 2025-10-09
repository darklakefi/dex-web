import { tanstackClient } from "@dex-web/orpc";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ADDRESS_QUERY_THRESHOLD } from "../../_utils/tokenSearch";
import {
  POPULAR_TOKEN_SEARCHES,
  PREFETCH_DELAY_MS,
  TOKEN_SEARCH_FETCH_SIZE,
} from "./constants";

/**
 * Custom hook to handle token search prefetching within SelectTokenModal.
 * This hook runs when the modal is open and prefetches popular tokens on mount,
 * then anticipates user searches by prefetching as they type.
 *
 * Note: This is separate from TokenModalPrefetch which runs on page mount.
 * This hook handles real-time prefetching while the user is actively searching.
 *
 * @param {string} rawQuery - The current raw search query (not debounced)
 * @param {boolean} isClosing - Whether the modal is closing (to prevent unnecessary prefetching)
 */
export function useTokenPrefetching(rawQuery: string, isClosing: boolean) {
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (isClosing) return;

    POPULAR_TOKEN_SEARCHES.forEach((searchTerm) => {
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
                rawQuery.length > ADDRESS_QUERY_THRESHOLD
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
      }, PREFETCH_DELAY_MS);
    }

    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
      }
    };
  }, [rawQuery, queryClient, isClosing]);
}
