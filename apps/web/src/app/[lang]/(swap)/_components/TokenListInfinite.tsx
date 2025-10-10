"use client";
import type { Token } from "@dex-web/orpc/schemas/index";
import { Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { useCallback, useEffect, useRef } from "react";
import { TokenImage } from "../../../_components/TokenImage";

interface TokenListInfiniteProps {
  tokens: Token[];
  onSelect: (token: Token, e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetching?: boolean;
}

/**
 * Simplified TokenList component with infinite scroll.
 * Uses IntersectionObserver for infinite scroll trigger instead of virtual scrolling.
 *
 * Features:
 * - Simple rendering with .map() (no virtualization needed for <100 tokens)
 * - Automatic infinite scroll when reaching the bottom sentinel
 * - Loading states for initial load and pagination
 */
export function TokenListInfinite({
  tokens,
  onSelect,
  title,
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  isFetching = false,
}: TokenListInfiniteProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up IntersectionObserver for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (
        target?.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage &&
        !isFetching &&
        fetchNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px", // Trigger 100px before reaching the sentinel
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  if (tokens.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {title && <Text.Body2 className="text-green-300">{title}</Text.Body2>}
        <div className="flex items-center justify-center py-20 text-green-300">
          No tokens available
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {title && (
        <Text.Body2 className="text-green-300">
          {title}
          {(isLoading || isFetching) && (
            <span className="ml-2 inline-block size-4 animate-spin rounded-full border-2 border-green-300 border-t-transparent" />
          )}
        </Text.Body2>
      )}
      <div
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-green-600/40 scrollbar-thumb-rounded-full hover:scrollbar-thumb-green-600/60 overflow-y-auto transition-all duration-200"
        style={{
          height: "400px",
          width: "100%",
        }}
      >
        {isLoading && tokens.length === 0 ? (
          // Initial loading skeleton
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <div
                className="flex items-center gap-3 p-2"
                key={`skeleton-${n}`}
              >
                <div className="size-8 animate-pulse rounded-full bg-green-600/40" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-16 animate-pulse rounded bg-green-600/40" />
                  <div className="h-3 w-24 animate-pulse rounded bg-green-600/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {tokens.map((token, index) => (
              <div
                className="cursor-pointer transition-opacity duration-150 hover:opacity-70"
                key={token.address}
              >
                <button
                  className="flex w-full cursor-pointer items-start justify-start gap-3 p-2 text-left transition-colors duration-150 hover:bg-green-600/10"
                  onClick={(e) => onSelect(token, e)}
                  type="button"
                >
                  <TokenImage
                    address={token.address}
                    imageUrl={token.imageUrl}
                    priority={index < 10}
                    size={32}
                    symbol={token.symbol}
                  />
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <div className="flex min-w-0 gap-3">
                      <Text.Body2 as="span" className="font-medium">
                        {token.symbol}
                      </Text.Body2>
                      <div className="flex-shrink-0">
                        <span className="bg-green-600 px-1 text-green-300 text-sm">
                          {truncate(token.address, 4, 4)}
                        </span>
                      </div>
                    </div>
                    <span className="truncate text-green-300 text-sm">
                      {token.name}
                    </span>
                  </div>
                </button>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div
              className="flex items-center justify-center gap-3 p-2"
              ref={loadMoreRef}
            >
              {hasNextPage ? (
                <>
                  <div className="size-6 animate-spin rounded-full border-2 border-green-300 border-t-transparent" />
                  <Text.Body2 className="text-green-300">
                    Loading more...
                  </Text.Body2>
                </>
              ) : tokens.length > 0 ? (
                <Text.Body2 className="text-green-300/60">
                  Nothing more to load
                </Text.Body2>
              ) : null}
            </div>
          </>
        )}
      </div>
      {isFetching && !isFetchingNextPage && (
        <Text.Body2 className="text-center text-green-300/60 text-xs">
          Updating...
        </Text.Body2>
      )}
    </div>
  );
}

// Enable why-did-you-render tracking for this component
TokenListInfinite.whyDidYouRender = true;
