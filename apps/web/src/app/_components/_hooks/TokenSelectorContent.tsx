"use client";

import type { Token } from "@dex-web/orpc/schemas/index";
import { TokenList } from "../../[lang]/(swap)/_components/TokenList";
import { NoResultFound } from "../NoResultFound";
import { useTokenSearch } from "./useTokenSearch";

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
 * Handles initial load (recent + popular), search results, and empty states.
 */
export function TokenSelectorContent({
  debouncedQuery,
  isInitialLoad,
  onSelectToken,
  recentTokens,
  returnUrl,
}: TokenSelectorContentProps) {
  const { data } = useTokenSearch(debouncedQuery);

  if (isInitialLoad) {
    return (
      <>
        {recentTokens.length > 0 && (
          <TokenList
            onSelect={onSelectToken}
            title="Recently Searches"
            tokens={recentTokens}
          />
        )}
        <TokenList
          onSelect={onSelectToken}
          title="tokens by 24h volume"
          tokens={data.tokens}
        />
      </>
    );
  }

  if (data.tokens.length > 0) {
    return <TokenList onSelect={onSelectToken} tokens={data.tokens} />;
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
