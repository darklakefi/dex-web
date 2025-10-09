import type { Token } from "@dex-web/orpc/schemas/index";
import { useCallback } from "react";
import useLocalStorageState from "use-local-storage-state";
import { useWalletPublicKey } from "../../../hooks/useWalletCache";

/**
 * Custom hook to manage recently searched tokens per wallet.
 * Stores up to 10 recent tokens per connected wallet address.
 *
 * @returns {Object} Object containing recent tokens and add function
 * @returns {Token[]} recentTokens - Array of recently searched tokens for the connected wallet
 * @returns {Function} addRecentToken - Function to add a token to recent searches
 */
export function useRecentTokens() {
  const { data: publicKey } = useWalletPublicKey();
  const connectedWalletAddress = publicKey?.toBase58() ?? "";

  const [searchedTokens, setSearchedTokens] = useLocalStorageState<{
    [key: string]: Token[];
  }>("tokenSearched", {
    defaultValue: {},
  });

  const addRecentToken = useCallback(
    (token: Token) => {
      if (!connectedWalletAddress) return;

      setSearchedTokens((prev) => {
        const current = prev[connectedWalletAddress] || [];
        const updated = [
          token,
          ...current.filter((t) => t.address !== token.address),
        ].slice(0, 10);
        return { ...prev, [connectedWalletAddress]: updated };
      });
    },
    [connectedWalletAddress, setSearchedTokens],
  );

  return {
    addRecentToken,
    recentTokens: searchedTokens[connectedWalletAddress] ?? [],
  };
}
