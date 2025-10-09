/**
 * Token search utilities using MiniSearch for intelligent full-text search
 * Provides fuzzy matching, field boosting, and relevance ranking
 */

import MiniSearch from "minisearch";

interface TokenSearchable {
  address: string;
  name: string;
  symbol: string;
}

/**
 * Minimum character length to treat a search query as a potential address search.
 * Solana addresses are typically 32-44 characters long.
 */
export const ADDRESS_QUERY_THRESHOLD = 30;

/**
 * Create and configure a MiniSearch instance for token searching
 *
 * Configuration priorities (from user perspective):
 * 1. Symbol field is most important (users often search by ticker like "SOL")
 * 2. Name field is second (when they don't remember the exact ticker)
 * 3. Address field is for power users (searching by contract address)
 *
 * Search features:
 * - Fuzzy matching with edit distance 0.2 for typo tolerance
 * - Prefix matching for "as you type" search experience
 * - Field boosting to prioritize symbol matches
 * - Case-insensitive search
 *
 * Best Practice: This function should be called once and memoized (e.g., with useMemo)
 * at the call site to avoid re-indexing on every render.
 */
export function createTokenSearchIndex<T extends TokenSearchable>(
  tokens: T[],
): MiniSearch<T> {
  const miniSearch = new MiniSearch<T>({
    fields: ["symbol", "name", "address"],
    idField: "address",
    searchOptions: {
      boost: {
        address: 1,
        name: 2,
        symbol: 3,
      },
      combineWith: "OR",
      fuzzy: 0.2,
      prefix: true,
    },
    storeFields: ["address"],
  });

  miniSearch.addAll(tokens);

  return miniSearch;
}

/**
 * Search tokens using a pre-built MiniSearch index
 *
 * This is the optimized version that expects a memoized index.
 * For empty queries, returns all tokens in original order (typically by volume).
 * For queries, returns tokens sorted by relevance score (best matches first).
 *
 * Special handling:
 * - Long queries (>ADDRESS_QUERY_THRESHOLD chars) are treated as exact address searches
 * - Short queries use fuzzy matching and prefix search
 *
 * @param miniSearch - Pre-built MiniSearch index (should be memoized)
 * @param tokens - Original array of tokens (for mapping results back)
 * @param query - User's search query
 * @returns Sorted array of tokens (most relevant first), or empty array if no matches
 */
export function searchTokens<T extends TokenSearchable>(
  miniSearch: MiniSearch<T>,
  tokens: T[],
  query: string,
): T[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return tokens;
  }

  const searchOptions =
    trimmedQuery.length > ADDRESS_QUERY_THRESHOLD
      ? {
          boost: { address: 3, name: 1, symbol: 1 },
          fuzzy: false,
          prefix: true,
        }
      : undefined;

  const results = miniSearch.search(trimmedQuery, searchOptions);

  const tokenMap = new Map(tokens.map((token) => [token.address, token]));

  return results
    .map((result) => tokenMap.get(result.id))
    .filter((token): token is T => token !== undefined);
}

/**
 * Legacy helper function for backwards compatibility
 *
 * Creates a new index on every call - for optimal performance, use createTokenSearchIndex
 * + searchTokens with useMemo at the call site instead.
 *
 * @deprecated Consider using createTokenSearchIndex + searchTokens for better performance
 */
export function sortTokensByRelevance<T extends TokenSearchable>(
  tokens: T[],
  query: string,
): T[] {
  const miniSearch = createTokenSearchIndex(tokens);
  return searchTokens(miniSearch, tokens, query);
}
