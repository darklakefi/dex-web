/**
 * Query configuration constants for optimal performance
 * Cache times are tuned based on data volatility:
 * - Metadata: 30min (stable - logos/names rarely change)
 * - Search: 5min (ephemeral - user searches)
 * - Detail: 10min (semi-volatile - includes price data)
 * - Owner: 30min (stable - balances updated separately)
 *
 * Refetch behaviors are disabled for stable data (metadata) to prevent
 * unnecessary requests, especially with large datasets (thousands of tokens).
 */
export const QUERY_CONFIG = {
  /**
   * Pool tokens metadata
   * Derived from pools, moderately stable
   */
  poolTokensMetadata: {
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  },

  /**
   * Token detail (includes price and additional metadata)
   * More volatile than pure metadata
   */
  tokenDetail: {
    gcTime: 10 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  },
  /**
   * Token metadata (name, symbol, logo, decimals)
   * Very stable data - aggressive caching
   */
  tokenMetadata: {
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 30 * 60 * 1000,
  },

  tokenOwner: {
    gcTime: 60 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
  },

  /**
   * Token search results
   * Ephemeral data, shorter cache
   */
  tokenSearch: {
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  },

  tokens: {
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  },
} as const;
