import type { Token } from "@dex-web/orpc/schemas/index";
import { Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import Image from "next/image";
import { useRef } from "react";

interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token, e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}

export function TokenList({ tokens, onSelect, title }: TokenListProps) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: tokens.length,
    estimateSize: () => 68,
    getItemKey: (index) => tokens[index]?.address ?? index,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  return (
    <div className="flex flex-col gap-4">
      {title && <Text.Body2 className="text-green-300">{title}</Text.Body2>}
      <ul
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-green-600/60 relative flex h-[400px] flex-col gap-4 overflow-y-auto transition-all duration-200"
        ref={parentRef}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
            width: "100%",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const token = tokens[virtualItem.index];
            if (!token) return null;
            return (
              <li
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
                  {token.imageUrl ? (
                    <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-green-500 text-xs leading-8">
                      <Image
                        alt={token.symbol}
                        className="h-full w-full object-cover"
                        height={32}
                        priority
                        src={token.imageUrl}
                        unoptimized
                        width={32}
                      />
                    </div>
                  ) : null}
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
              </li>
            );
          })}
        </div>
      </ul>
    </div>
  );
}
