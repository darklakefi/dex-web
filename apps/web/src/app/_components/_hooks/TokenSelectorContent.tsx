"use client";

import type { Token } from "@dex-web/orpc/schemas/index";
import { TokenListInfinite } from "../../[lang]/(swap)/_components/TokenListInfinite";
import { NoResultFound } from "../NoResultFound";
import { usePoolTokens } from "./usePoolTokens";
import { useTokenInfiniteSearch } from "./useTokenInfiniteSearch";

interface TokenSelectorContentProps {
  debouncedQuery: string;
  isInitialLoad: boolean;
  onSelectToken: (
    selectedToken: Token,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  recentTokens: Token[];
  returnUrl: string;
}

const allowUnknownTokenReturnUrls = ["liquidity"];

/**
 * Component responsible for rendering token lists based on search state.
 * Handles initial load (recent + popular), search results with infinite scroll, and empty states.
 * Now includes proper loading states, error handling, and infinite scroll support.
 */
export function TokenSelectorContent({
  debouncedQuery,
  isInitialLoad,
  onSelectToken,
  recentTokens: _recentTokens,
  returnUrl,
}: TokenSelectorContentProps) {
  const {
    tokens: searchTokens,
    isLoading: isSearchLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching: isSearchFetching,
  } = useTokenInfiniteSearch(debouncedQuery);

  const {
    data: poolTokens,
    isLoading: isLoadingPoolTokens,
    isError: isPoolTokensError,
    hasData,
  } = usePoolTokens();

  if (isInitialLoad) {
    if (isLoadingPoolTokens && !hasData) {
      return (
        <div className="flex flex-col gap-4">
          <div className="h-6 w-32 animate-pulse rounded bg-green-600/40" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="flex items-center gap-3"
                key={`skeleton-token-loading-${Date.now()}-${index}`}
              >
                <div className="size-8 animate-pulse rounded-full bg-green-600/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-green-600/40" />
                  <div className="h-3 w-24 animate-pulse rounded bg-green-600/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isPoolTokensError && !hasData) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-red-400">
            Failed to load tokens. Please try again.
          </div>
          <button
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            onClick={() => window.location.reload()}
            type="button"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <TokenListInfinite
        isLoading={isLoadingPoolTokens}
        key={`pool-tokens-${poolTokens.length}`}
        onSelect={onSelectToken}
        title={isLoadingPoolTokens ? "Loading tokens..." : "Popular tokens"}
        tokens={poolTokens}
      />
    );
  }

  if (searchTokens.length > 0) {
    return (
      <TokenListInfinite
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetching={isSearchFetching}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isSearchLoading}
        key="search-results"
        onSelect={onSelectToken}
        tokens={searchTokens}
      />
    );
  }

  if (isSearchLoading && searchTokens.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-6 w-32 animate-pulse rounded bg-green-600/40" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="flex items-center gap-3"
              key={`skeleton-search-loading-${Date.now()}-${index}`}
            >
              <div className="size-8 animate-pulse rounded-full bg-green-600/40" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-16 animate-pulse rounded bg-green-600/40" />
                <div className="h-3 w-24 animate-pulse rounded bg-green-600/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NoResultFound
      allowUnknownTokens={allowUnknownTokenReturnUrls.includes(returnUrl)}
      className="py-20"
      handleSelect={onSelectToken}
      search={debouncedQuery}
    />
  );
}
