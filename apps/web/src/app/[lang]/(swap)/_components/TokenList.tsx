import type { Token } from "@dex-web/orpc/schemas";
import { Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import Image from "next/image";
import { memo } from "react";

interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token, e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}

function TokenListComponent({ tokens, onSelect, title }: TokenListProps) {
  return (
    <div className="flex flex-col gap-4">
      {title && <Text.Body2 className="text-green-300">{title}</Text.Body2>}
      <ul className="flex flex-col gap-4 overflow-y-auto">
        {tokens.map((token) => {
          const id = `${token.symbol}-${token.address}`;
          return (
            <li className="cursor-pointer hover:opacity-70" key={id}>
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
      </ul>
    </div>
  );
}

export const TokenList = memo(TokenListComponent, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.tokens.length !== nextProps.tokens.length) return false;

  for (let i = 0; i < prevProps.tokens.length; i++) {
    if (prevProps.tokens[i]!.address !== nextProps.tokens[i]!.address) {
      return false;
    }
  }

  return true;
});
