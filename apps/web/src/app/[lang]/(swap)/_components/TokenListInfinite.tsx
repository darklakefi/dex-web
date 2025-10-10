import type { Token } from "@dex-web/orpc/schemas/index";
import { Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
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
 * TokenList component with infinite scroll and virtual scrolling support.
 * Implements the pattern from TanStack Virtual + TanStack Query infinite queries.
 *
 * Features:
 * - Virtual scrolling for performance with large lists
 * - Automatic infinite scroll when reaching the end
 * - Loading states for initial load and pagination
 * - Loader row at the bottom to trigger next page
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
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = hasNextPage ? tokens.length + 1 : tokens.length;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: useCallback(() => 68, []),
    getItemKey: useCallback(
      (index: number) => {
        if (index >= tokens.length) return `loading-${index}`;
        return tokens[index]?.address ?? `loading-${index}`;
      },
      [tokens],
    ),
    getScrollElement: useCallback(() => parentRef.current, []),
    overscan: 5,
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= tokens.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetching &&
      fetchNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    tokens.length,
    isFetchingNextPage,
    isFetching,
    rowVirtualizer.getVirtualItems,
  ]);

  useEffect(() => {
    if (tokens.length > 0 && parentRef.current) {
      const timeoutId = setTimeout(() => {
        rowVirtualizer.measure();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [tokens.length, rowVirtualizer]);

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

  const virtualItems = rowVirtualizer.getVirtualItems();

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
        ref={parentRef}
        style={{
          height: "400px",
          width: "100%",
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
            width: "100%",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const isLoaderRow = virtualItem.index >= tokens.length;
            const token = tokens[virtualItem.index];

            if (isLoaderRow) {
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    height: `${virtualItem.size}px`,
                    left: 0,
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualItem.start}px)`,
                    width: "100%",
                  }}
                >
                  <div className="flex items-center justify-center gap-3 p-2">
                    {hasNextPage ? (
                      <>
                        <div className="size-6 animate-spin rounded-full border-2 border-green-300 border-t-transparent" />
                        <Text.Body2 className="text-green-300">
                          Loading more...
                        </Text.Body2>
                      </>
                    ) : (
                      <Text.Body2 className="text-green-300/60">
                        Nothing more to load
                      </Text.Body2>
                    )}
                  </div>
                </div>
              );
            }

            if (!token) {
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    height: `${virtualItem.size}px`,
                    left: 0,
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualItem.start}px)`,
                    width: "100%",
                  }}
                >
                  <div className="flex items-center gap-3 p-2">
                    <div className="size-8 animate-pulse rounded-full bg-green-600/40" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-16 animate-pulse rounded bg-green-600/40" />
                      <div className="h-3 w-24 animate-pulse rounded bg-green-600/40" />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                className="cursor-pointer transition-opacity duration-150 hover:opacity-70"
                key={virtualItem.key}
                style={{
                  height: `${virtualItem.size}px`,
                  left: 0,
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${virtualItem.start}px)`,
                  width: "100%",
                }}
              >
                <button
                  className="flex w-full cursor-pointer items-start justify-start gap-3 p-2 text-left transition-colors duration-150 hover:bg-green-600/10"
                  onClick={(e) => onSelect(token, e)}
                  type="button"
                >
                  <TokenImage
                    address={token.address}
                    imageUrl={token.imageUrl}
                    priority={virtualItem.index < 10}
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
            );
          })}
        </div>
      </div>
      {}
      {isFetching && !isFetchingNextPage && (
        <Text.Body2 className="text-center text-green-300/60 text-xs">
          Updating...
        </Text.Body2>
      )}
    </div>
  );
}
