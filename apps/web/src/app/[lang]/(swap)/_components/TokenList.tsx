import type { Token } from "@dex-web/orpc/schemas";
import { Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import Image from "next/image";

interface TokenListProps {
  tokens: Token[];
  onSelect: (tokenSymbol: string) => void;
}

export function TokenList({ tokens, onSelect }: TokenListProps) {
  return (
    <ul className="flex flex-col gap-4 overflow-y-auto">
      {tokens.map((token) => {
        const id = `${token.symbol}-${token.address}`;
        return (
          <li key={id}>
            <button
              className="flex items-start justify-start gap-3"
              onClick={() => onSelect(token.address)}
              type="button"
            >
              {token.imageUrl ? (
                <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-green-500 text-xs leading-8">
                  <Image
                    alt={token.symbol}
                    height={32}
                    priority
                    src={token.imageUrl}
                    unoptimized
                    width={32}
                  />
                </div>
              ) : null}
              <div className="flex flex-col items-start">
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
  );
}
