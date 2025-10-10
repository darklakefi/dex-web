import type { Token } from "@dex-web/orpc/schemas/index";
import { Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { TokenImage } from "../../../_components/TokenImage";

interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token, e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}

export function TokenList({ tokens, onSelect, title }: TokenListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tokens.length,
    estimateSize: () => 68,
    getItemKey: (index) => tokens[index]?.address ?? index,
    getScrollElement: () => parentRef.current,
    overscan: 10,
  });

  useEffect(() => {
    if (tokens.length > 0 && parentRef.current) {
      requestAnimationFrame(() => {
        rowVirtualizer.measure();
      });
    }
  }, [tokens.length, rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex flex-col gap-4">
      {title && <Text.Body2 className="text-green-300">{title}</Text.Body2>}
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
            const token = tokens[virtualItem.index];
            if (!token) return null;
            return (
              <div
                className="cursor-pointer hover:opacity-70"
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
                  className="flex cursor-pointer items-start justify-start gap-3"
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
                  <div className="flex cursor-pointer flex-col items-start">
                    <div className="flex gap-3">
                      <Text.Body2 as="span">{token.symbol}</Text.Body2>
                      <div>
                        <span className="bg-green-600 px-1 text-green-300 text-sm">
                          {truncate(token.address, 4, 4)}
                        </span>
                      </div>
                    </div>
                    <span className="text-green-300 text-sm">{token.name}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
